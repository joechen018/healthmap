#!/usr/bin/env python3
"""
Add entity script for HealthMap.

This script provides a simple CLI for adding a new healthcare entity.
"""

import os
import sys
import argparse
import logging

# Add the parent directory to the path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the process_entity function from the backend
from backend.main import process_entity

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def add_entity(entity_name, force=False):
    """
    Add a new healthcare entity
    
    Args:
        entity_name (str): Name of the healthcare entity
        force (bool): Whether to force overwrite if entity already exists
        
    Returns:
        bool: True if successful, False otherwise
    """
    logger.info(f"Adding entity: {entity_name}")
    
    # Normalize entity name for filename
    entity_filename = entity_name.lower().replace(" ", "_").replace("/", "_")
    entity_filepath = f"data/entities/{entity_filename}.json"
    
    # Check if entity already exists
    if os.path.exists(entity_filepath) and not force:
        logger.error(f"Entity already exists: {entity_name}")
        logger.error(f"Use --force to overwrite")
        return False
    
    # Process the entity
    result = process_entity(entity_name, update_existing=force)
    
    if "error" in result:
        logger.error(f"Error processing {entity_name}: {result['error']}")
        return False
    
    logger.info(f"Successfully added {entity_name}")
    return True

def main():
    """
    Main entry point for the script
    """
    parser = argparse.ArgumentParser(description="Add a new healthcare entity")
    parser.add_argument("entity", help="Name of the healthcare entity to add")
    parser.add_argument("-f", "--force", action="store_true", help="Force overwrite if entity already exists")
    
    args = parser.parse_args()
    
    # Create data directory if it doesn't exist
    os.makedirs("data/entities", exist_ok=True)
    
    # Add the entity
    success = add_entity(args.entity, args.force)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
