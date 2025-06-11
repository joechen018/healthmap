"""
Wikipedia scraper module for HealthMap.

This module provides functions to scrape healthcare entity information from Wikipedia.
"""

import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Constants
USER_AGENT = os.getenv('USER_AGENT', 'HealthMap/1.0 (Research Project)')
WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"
WIKIPEDIA_BASE_URL = "https://en.wikipedia.org/wiki/"

def scrape_wikipedia(entity_name):
    """
    Scrape information about a healthcare entity from Wikipedia.
    
    Args:
        entity_name (str): Name of the healthcare entity to scrape
        
    Returns:
        dict: Scraped information including summary, infobox data, and relevant sections
    """
    logger.info(f"Scraping Wikipedia for: {entity_name}")
    
    # Normalize entity name for URL
    entity_url_name = entity_name.replace(" ", "_")
    
    # First, try to get the page content
    try:
        # Get the Wikipedia page
        headers = {'User-Agent': USER_AGENT}
        response = requests.get(
            f"{WIKIPEDIA_BASE_URL}{entity_url_name}", 
            headers=headers
        )
        response.raise_for_status()
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract the main content
        content = soup.find(id="mw-content-text")
        if not content:
            logger.warning(f"Could not find main content for {entity_name}")
            return {"error": "No content found", "entity_name": entity_name}
        
        # Extract the summary (first paragraph of the article)
        summary = ""
        paragraphs = content.find_all('p')
        for p in paragraphs:
            if p.text.strip():
                summary = p.text.strip()
                break
        
        # Extract infobox data if available
        infobox_data = {}
        infobox = soup.find('table', {'class': 'infobox'})
        if infobox:
            rows = infobox.find_all('tr')
            for row in rows:
                header = row.find('th')
                value = row.find('td')
                if header and value:
                    key = header.text.strip()
                    val = value.text.strip()
                    infobox_data[key] = val
        
        # Extract relevant sections (like History, Operations, Subsidiaries)
        sections = {}
        current_section = None
        for element in content.find_all(['h2', 'h3', 'p']):
            if element.name in ['h2', 'h3']:
                current_section = element.text.strip()
                # Remove "edit" links in section titles
                current_section = re.sub(r'\[\w+\]', '', current_section).strip()
                sections[current_section] = ""
            elif element.name == 'p' and current_section and element.text.strip():
                sections[current_section] += element.text.strip() + "\n"
        
        # Compile the results
        result = {
            "entity_name": entity_name,
            "summary": summary,
            "infobox": infobox_data,
            "sections": {k: v for k, v in sections.items() if v.strip()}  # Only include non-empty sections
        }
        
        logger.info(f"Successfully scraped Wikipedia data for {entity_name}")
        return result
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching Wikipedia page for {entity_name}: {str(e)}")
        return {"error": str(e), "entity_name": entity_name}
    except Exception as e:
        logger.error(f"Unexpected error scraping Wikipedia for {entity_name}: {str(e)}")
        return {"error": str(e), "entity_name": entity_name}

def search_wikipedia(query):
    """
    Search Wikipedia for a healthcare entity.
    
    Args:
        query (str): Search query
        
    Returns:
        list: List of potential matches with titles and snippets
    """
    logger.info(f"Searching Wikipedia for: {query}")
    
    try:
        # Set up the API parameters
        params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query,
            "srlimit": 5
        }
        
        # Make the API request
        headers = {'User-Agent': USER_AGENT}
        response = requests.get(WIKIPEDIA_API_URL, params=params, headers=headers)
        response.raise_for_status()
        
        # Parse the results
        data = response.json()
        search_results = data.get("query", {}).get("search", [])
        
        results = []
        for result in search_results:
            results.append({
                "title": result.get("title", ""),
                "snippet": BeautifulSoup(result.get("snippet", ""), "html.parser").text,
                "pageid": result.get("pageid", 0)
            })
        
        logger.info(f"Found {len(results)} Wikipedia search results for {query}")
        return results
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error searching Wikipedia for {query}: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error searching Wikipedia for {query}: {str(e)}")
        return []

# For testing
if __name__ == "__main__":
    import json
    
    # Test the scraper with a sample entity
    entity = "UnitedHealth Group"
    result = scrape_wikipedia(entity)
    
    # Print the result
    print(json.dumps(result, indent=2))
