"""
Claude API integration module for HealthMap.

This module provides functions to enrich healthcare entity data using Anthropic's Claude API.
"""

import os
import json
import anthropic
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Constants
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')
CLAUDE_MODEL = "claude-3-opus-20240229"  # Updated to a different model

def enrich_entity_data(entity_name, scraped_data):
    """
    Enrich entity data using Claude API
    
    Args:
        entity_name (str): Name of the healthcare entity
        scraped_data (dict): Basic data scraped from public sources
        
    Returns:
        dict: Enriched entity data with relationships and subsidiaries
    """
    if not CLAUDE_API_KEY:
        logger.error("Claude API key not found. Please set CLAUDE_API_KEY in .env file.")
        return {"error": "API key not configured", "entity_name": entity_name}
    
    logger.info(f"Enriching data for {entity_name} using Claude API")
    
    try:
        # Remove any proxy settings from environment variables to avoid issues
        os.environ.pop('HTTP_PROXY', None)
        os.environ.pop('HTTPS_PROXY', None)
        os.environ.pop('http_proxy', None)
        os.environ.pop('https_proxy', None)
        
        # Initialize the Anthropic client without proxies
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        
        # Prepare the data for the prompt
        summary = scraped_data.get("summary", "")
        infobox = scraped_data.get("infobox", {})
        sections = scraped_data.get("sections", {})
        
        # Format the infobox data
        infobox_text = "\n".join([f"{key}: {value}" for key, value in infobox.items()])
        
        # Format the sections data
        sections_text = "\n\n".join([f"## {section}\n{content}" for section, content in sections.items()])
        
        # Construct the prompt
        prompt = f"""
        You are a healthcare industry expert. Based on the following information about {entity_name}, please identify:
        
        1. Entity type (Payer, Provider, Vendor, or Integrated)
        2. Parent company (if any)
        3. Subsidiaries (list all that are mentioned)
        4. Annual revenue (with B for billions or M for millions)
        5. Key relationships with other healthcare entities
        
        Information about {entity_name}:
        
        SUMMARY:
        {summary}
        
        INFOBOX DATA:
        {infobox_text}
        
        ADDITIONAL SECTIONS:
        {sections_text}
        
        Return ONLY a JSON object following this exact schema, with no additional text:
        {{
          "name": "{entity_name}",
          "type": "Entity Type",
          "parent": "Parent Company Name or null",
          "revenue": "Revenue with B/M suffix or null",
          "subsidiaries": ["Subsidiary1", "Subsidiary2"],
          "relationships": [
            {{"target": "Company Name", "type": "relationship_type"}}
          ]
        }}
        
        For relationship types, use: owned_by, owns, partner, competitor, customer, vendor
        
        If you're uncertain about any field, use your knowledge of the healthcare industry to make an educated guess, but mark uncertain fields with an asterisk (*) at the end.
        """
        
        # Call the Claude API
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2000,
            temperature=0.2,
            system="You are a healthcare industry expert who extracts structured information about healthcare companies. IMPORTANT: Return ONLY the raw JSON object with no additional text, explanations, or markdown formatting.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract the JSON from the response
        response_text = response.content[0].text
        
        # Sometimes Claude might wrap the JSON in markdown code blocks, so we need to extract it
        if "```json" in response_text:
            json_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_text = response_text.split("```")[1].strip()
        else:
            # If Claude returns text before the JSON, try to extract just the JSON part
            # Look for the first occurrence of '{'
            if '{' in response_text:
                start_idx = response_text.find('{')
                # Find the matching closing brace
                brace_count = 0
                end_idx = -1
                for i in range(start_idx, len(response_text)):
                    if response_text[i] == '{':
                        brace_count += 1
                    elif response_text[i] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end_idx = i + 1
                            break
                
                if end_idx > start_idx:
                    json_text = response_text[start_idx:end_idx].strip()
                else:
                    json_text = response_text.strip()
            else:
                json_text = response_text.strip()
        
        # Parse the JSON
        enriched_data = json.loads(json_text)
        
        # Validate the required fields
        required_fields = ["name", "type", "subsidiaries", "relationships"]
        for field in required_fields:
            if field not in enriched_data:
                enriched_data[field] = [] if field in ["subsidiaries", "relationships"] else None
        
        logger.info(f"Successfully enriched data for {entity_name}")
        return enriched_data
        
    except anthropic.APIError as e:
        logger.error(f"Claude API error for {entity_name}: {str(e)}")
        return {"error": f"Claude API error: {str(e)}", "entity_name": entity_name}
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error for {entity_name}: {str(e)}")
        logger.error(f"Response text: {response_text}")
        return {"error": f"JSON parsing error: {str(e)}", "entity_name": entity_name}
    except Exception as e:
        logger.error(f"Unexpected error enriching data for {entity_name}: {str(e)}")
        return {"error": str(e), "entity_name": entity_name}

def infer_relationships(entities):
    """
    Infer relationships between multiple healthcare entities
    
    Args:
        entities (list): List of entity data dictionaries
        
    Returns:
        list: Updated list of entities with inferred relationships
    """
    if not CLAUDE_API_KEY:
        logger.error("Claude API key not found. Please set CLAUDE_API_KEY in .env file.")
        return entities
    
    logger.info(f"Inferring relationships between {len(entities)} entities")
    
    try:
        # Remove any proxy settings from environment variables to avoid issues
        os.environ.pop('HTTP_PROXY', None)
        os.environ.pop('HTTPS_PROXY', None)
        os.environ.pop('http_proxy', None)
        os.environ.pop('https_proxy', None)
        
        # Initialize the Anthropic client without proxies
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        
        # Format the entities data
        entities_json = json.dumps(entities, indent=2)
        
        # Construct the prompt
        prompt = f"""
        You are a healthcare industry expert. Based on the following information about multiple healthcare entities, please infer additional relationships between them that might not be explicitly stated.
        
        Entities:
        {entities_json}
        
        For each entity, add or update the "relationships" array with any additional relationships you can infer based on industry knowledge and the data provided.
        
        Return ONLY a JSON array of the updated entities, with no additional text.
        
        For relationship types, use: owned_by, owns, partner, competitor, customer, vendor
        """
        
        # Call the Claude API
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4000,
            temperature=0.2,
            system="You are a healthcare industry expert who infers relationships between healthcare companies. IMPORTANT: Return ONLY the raw JSON array with no additional text, explanations, or markdown formatting.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract the JSON from the response
        response_text = response.content[0].text
        
        # Sometimes Claude might wrap the JSON in markdown code blocks, so we need to extract it
        if "```json" in response_text:
            json_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_text = response_text.split("```")[1].strip()
        else:
            # If Claude returns text before the JSON, try to extract just the JSON part
            # Look for the first occurrence of '['
            if '[' in response_text:
                start_idx = response_text.find('[')
                # Find the matching closing bracket
                bracket_count = 0
                end_idx = -1
                for i in range(start_idx, len(response_text)):
                    if response_text[i] == '[':
                        bracket_count += 1
                    elif response_text[i] == ']':
                        bracket_count -= 1
                        if bracket_count == 0:
                            end_idx = i + 1
                            break
                
                if end_idx > start_idx:
                    json_text = response_text[start_idx:end_idx].strip()
                else:
                    json_text = response_text.strip()
            else:
                json_text = response_text.strip()
        
        # Parse the JSON
        updated_entities = json.loads(json_text)
        
        logger.info(f"Successfully inferred relationships between {len(entities)} entities")
        return updated_entities
        
    except anthropic.APIError as e:
        logger.error(f"Claude API error inferring relationships: {str(e)}")
        return entities
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error inferring relationships: {str(e)}")
        logger.error(f"Response text: {response_text}")
        return entities
    except Exception as e:
        logger.error(f"Unexpected error inferring relationships: {str(e)}")
        return entities

# For testing
if __name__ == "__main__":
    import sys
    import os
    
    # Add the parent directory to the path
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    from scraper.wikipedia import scrape_wikipedia
    
    # Test the enrichment with a sample entity
    entity_name = "UnitedHealth Group"
    scraped_data = scrape_wikipedia(entity_name)
    enriched_data = enrich_entity_data(entity_name, scraped_data)
    
    # Print the result
    print(json.dumps(enriched_data, indent=2))
