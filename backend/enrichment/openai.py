"""
OpenAI API integration module for HealthMap.

This module provides functions to enrich healthcare entity data using OpenAI's API.
This is provided as a fallback option if Claude is not available.
"""

import os
import json
import openai
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Constants
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL = "gpt-4"  # Use the latest available model

def enrich_entity_data(entity_name, scraped_data):
    """
    Enrich entity data using OpenAI API
    
    Args:
        entity_name (str): Name of the healthcare entity
        scraped_data (dict): Basic data scraped from public sources
        
    Returns:
        dict: Enriched entity data with relationships and subsidiaries
    """
    if not OPENAI_API_KEY:
        logger.error("OpenAI API key not found. Please set OPENAI_API_KEY in .env file.")
        return {"error": "API key not configured", "entity_name": entity_name}
    
    logger.info(f"Enriching data for {entity_name} using OpenAI API")
    
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
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
        
        # Call the OpenAI API
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a healthcare industry expert who extracts structured information about healthcare companies and returns it in valid JSON format only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=2000
        )
        
        # Extract the JSON from the response
        response_text = response.choices[0].message.content
        
        # Sometimes OpenAI might wrap the JSON in markdown code blocks, so we need to extract it
        if "```json" in response_text:
            json_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_text = response_text.split("```")[1].strip()
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
        
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error for {entity_name}: {str(e)}")
        return {"error": f"OpenAI API error: {str(e)}", "entity_name": entity_name}
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
    if not OPENAI_API_KEY:
        logger.error("OpenAI API key not found. Please set OPENAI_API_KEY in .env file.")
        return entities
    
    logger.info(f"Inferring relationships between {len(entities)} entities")
    
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
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
        
        # Call the OpenAI API
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a healthcare industry expert who infers relationships between healthcare companies and returns the updated data in valid JSON format only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=4000
        )
        
        # Extract the JSON from the response
        response_text = response.choices[0].message.content
        
        # Sometimes OpenAI might wrap the JSON in markdown code blocks, so we need to extract it
        if "```json" in response_text:
            json_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_text = response_text.split("```")[1].strip()
        else:
            json_text = response_text.strip()
        
        # Parse the JSON
        updated_entities = json.loads(json_text)
        
        logger.info(f"Successfully inferred relationships between {len(entities)} entities")
        return updated_entities
        
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error inferring relationships: {str(e)}")
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
