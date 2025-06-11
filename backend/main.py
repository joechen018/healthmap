"""
Main entry point for the HealthMap backend.

This script provides the main functionality for scraping and enriching healthcare entity data.
"""

import os
import sys
import json
import argparse
import logging
from dotenv import load_dotenv

# Import modules
from scraper.wikipedia import scrape_wikipedia, search_wikipedia
from scraper.news import scrape_recent_news
from enrichment.claude import enrich_entity_data, infer_relationships
from utils.json_utils import save_entity_json, load_entity_json, validate_entity_json, merge_entity_data

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def process_entity(entity_name, update_existing=True, infer_additional=True):
    """
    Process a healthcare entity by scraping data and enriching with LLM
    
    Args:
        entity_name (str): Name of the healthcare entity to process
        update_existing (bool): Whether to update existing entity data if it exists
        infer_additional (bool): Whether to infer additional relationships
        
    Returns:
        dict: Processed entity data
    """
    logger.info(f"Processing entity: {entity_name}")
    
    # Normalize entity name for filename
    entity_filename = entity_name.lower().replace(" ", "_").replace("/", "_")
    entity_filepath = f"data/entities/{entity_filename}.json"
    
    # Check if entity already exists
    existing_data = None
    if update_existing:
        existing_data = load_entity_json(entity_filepath)
        if existing_data:
            logger.info(f"Found existing data for {entity_name}")
    
    # Step 1: Scrape Wikipedia data
    logger.info(f"Scraping Wikipedia data for {entity_name}")
    scraped_data = scrape_wikipedia(entity_name)
    
    if "error" in scraped_data:
        logger.warning(f"Error scraping Wikipedia for {entity_name}: {scraped_data['error']}")
        
        # Try searching Wikipedia for the entity
        logger.info(f"Searching Wikipedia for {entity_name}")
        search_results = search_wikipedia(entity_name)
        
        if search_results:
            logger.info(f"Found {len(search_results)} potential matches for {entity_name}")
            
            # Use the first search result if available
            first_result = search_results[0]
            logger.info(f"Using first search result: {first_result['title']}")
            
            # Try scraping the first result
            scraped_data = scrape_wikipedia(first_result['title'])
            
            if "error" in scraped_data:
                logger.error(f"Error scraping first search result: {scraped_data['error']}")
                return {"error": f"Could not find Wikipedia data for {entity_name}", "entity_name": entity_name}
        else:
            logger.error(f"No Wikipedia search results found for {entity_name}")
            return {"error": f"Could not find Wikipedia data for {entity_name}", "entity_name": entity_name}
    
    # Step 2: Scrape recent news (optional)
    logger.info(f"Scraping recent news for {entity_name}")
    news_data = scrape_recent_news(entity_name)
    
    # Add news data to scraped data
    if news_data:
        scraped_data["news"] = news_data
    
    # Step 3: Enrich data using LLM
    logger.info(f"Enriching data for {entity_name} using LLM")
    enriched_data = enrich_entity_data(entity_name, scraped_data)
    
    if "error" in enriched_data:
        logger.error(f"Error enriching data for {entity_name}: {enriched_data['error']}")
        return enriched_data
    
    # Step 4: Merge with existing data if available
    if existing_data:
        logger.info(f"Merging new data with existing data for {entity_name}")
        merged_data = merge_entity_data(existing_data, enriched_data)
    else:
        merged_data = enriched_data
    
    # Step 5: Validate the merged data
    is_valid, errors = validate_entity_json(merged_data)
    if not is_valid:
        logger.warning(f"Validation errors for {entity_name}:")
        for error in errors:
            logger.warning(f"- {error}")
    
    # Step 6: Save the entity data
    logger.info(f"Saving entity data for {entity_name}")
    save_entity_json(merged_data, entity_filepath)
    
    logger.info(f"Successfully processed {entity_name}")
    return merged_data

def infer_entity_relationships(directory="data/entities"):
    """
    Infer relationships between all entities in the directory
    
    Args:
        directory (str): Directory containing entity JSON files
        
    Returns:
        bool: True if successful, False otherwise
    """
    from utils.json_utils import load_all_entities
    
    logger.info("Inferring relationships between entities")
    
    # Load all entities
    entities = load_all_entities(directory)
    
    if not entities:
        logger.warning("No entities found to infer relationships")
        return False
    
    # Infer relationships
    updated_entities = infer_relationships(entities)
    
    # Save updated entities
    for entity in updated_entities:
        entity_name = entity.get("name")
        if not entity_name:
            logger.warning("Entity missing name, skipping")
            continue
        
        entity_filename = entity_name.lower().replace(" ", "_").replace("/", "_")
        entity_filepath = f"{directory}/{entity_filename}.json"
        
        save_entity_json(entity, entity_filepath)
    
    logger.info(f"Successfully inferred relationships for {len(updated_entities)} entities")
    return True

def main():
    """
    Main entry point for the script
    """
    parser = argparse.ArgumentParser(description="Process healthcare entity data")
    parser.add_argument("entity", nargs="?", help="Name of the healthcare entity to process")
    parser.add_argument("--no-update", action="store_true", help="Don't update existing entity data")
    parser.add_argument("--infer", action="store_true", help="Infer relationships between all entities")
    parser.add_argument("--list", action="store_true", help="List all processed entities")
    
    args = parser.parse_args()
    
    # Check if API key is configured
    if not os.getenv("CLAUDE_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        logger.error("No API key configured. Please set CLAUDE_API_KEY or OPENAI_API_KEY in .env file.")
        return 1
    
    # Create data directory if it doesn't exist
    os.makedirs("data/entities", exist_ok=True)
    
    # List all processed entities
    if args.list:
        from utils.json_utils import load_all_entities
        entities = load_all_entities()
        
        if not entities:
            print("No entities processed yet.")
            return 0
        
        print(f"Found {len(entities)} processed entities:")
        for entity in entities:
            name = entity.get("name", "Unknown")
            entity_type = entity.get("type", "Unknown")
            revenue = entity.get("revenue", "Unknown")
            subsidiaries = len(entity.get("subsidiaries", []))
            relationships = len(entity.get("relationships", []))
            
            print(f"- {name} ({entity_type})")
            print(f"  Revenue: {revenue}")
            print(f"  Subsidiaries: {subsidiaries}")
            print(f"  Relationships: {relationships}")
            print()
        
        return 0
    
    # Infer relationships between all entities
    if args.infer:
        success = infer_entity_relationships()
        return 0 if success else 1
    
    # Process a single entity
    if args.entity:
        result = process_entity(args.entity, update_existing=not args.no_update)
        
        if "error" in result:
            logger.error(f"Error processing {args.entity}: {result['error']}")
            return 1
        
        return 0
    
    # If no arguments provided, show help
    parser.print_help()
    return 0

if __name__ == "__main__":
    sys.exit(main())
