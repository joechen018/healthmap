"""
JSON utilities module for HealthMap.

This module provides functions for handling JSON data, including loading, saving,
and validating entity JSON files.
"""

import os
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def save_entity_json(entity_data, filepath):
    """
    Save entity data to a JSON file
    
    Args:
        entity_data (dict): Entity data to save
        filepath (str): Path to save the JSON file
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create directory if it doesn't exist
        directory = os.path.dirname(filepath)
        if not os.path.exists(directory):
            os.makedirs(directory)
            logger.info(f"Created directory: {directory}")
        
        # Save the JSON file with pretty formatting
        with open(filepath, 'w') as f:
            json.dump(entity_data, f, indent=2)
        
        logger.info(f"Saved entity data to {filepath}")
        return True
    except Exception as e:
        logger.error(f"Error saving entity data to {filepath}: {str(e)}")
        return False

def load_entity_json(filepath):
    """
    Load entity data from a JSON file
    
    Args:
        filepath (str): Path to the JSON file
    
    Returns:
        dict: Entity data, or None if the file doesn't exist or is invalid
    """
    try:
        if not os.path.exists(filepath):
            logger.warning(f"Entity file does not exist: {filepath}")
            return None
        
        with open(filepath, 'r') as f:
            entity_data = json.load(f)
        
        logger.info(f"Loaded entity data from {filepath}")
        return entity_data
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {filepath}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Error loading entity data from {filepath}: {str(e)}")
        return None

def load_all_entities(directory="data/entities"):
    """
    Load all entity JSON files from a directory
    
    Args:
        directory (str): Directory containing entity JSON files
    
    Returns:
        list: List of entity data dictionaries
    """
    entities = []
    
    try:
        if not os.path.exists(directory):
            logger.warning(f"Entities directory does not exist: {directory}")
            return entities
        
        # Get all JSON files in the directory
        json_files = [f for f in os.listdir(directory) if f.endswith('.json')]
        
        for filename in json_files:
            filepath = os.path.join(directory, filename)
            entity_data = load_entity_json(filepath)
            if entity_data:
                entities.append(entity_data)
        
        logger.info(f"Loaded {len(entities)} entities from {directory}")
        return entities
    except Exception as e:
        logger.error(f"Error loading entities from {directory}: {str(e)}")
        return entities

def validate_entity_json(entity_data):
    """
    Validate entity data against the expected schema
    
    Args:
        entity_data (dict): Entity data to validate
    
    Returns:
        tuple: (is_valid, errors) where is_valid is a boolean and errors is a list of error messages
    """
    errors = []
    
    # Check required fields
    required_fields = ["name", "type"]
    for field in required_fields:
        if field not in entity_data:
            errors.append(f"Missing required field: {field}")
    
    # Check that relationships is a list if present
    if "relationships" in entity_data and not isinstance(entity_data["relationships"], list):
        errors.append("Field 'relationships' must be a list")
    
    # Check that subsidiaries is a list if present
    if "subsidiaries" in entity_data and not isinstance(entity_data["subsidiaries"], list):
        errors.append("Field 'subsidiaries' must be a list")
    
    # Check relationship format if present
    if "relationships" in entity_data and isinstance(entity_data["relationships"], list):
        for i, rel in enumerate(entity_data["relationships"]):
            if not isinstance(rel, dict):
                errors.append(f"Relationship at index {i} must be an object")
                continue
            
            if "target" not in rel:
                errors.append(f"Relationship at index {i} missing required field: target")
            
            if "type" not in rel:
                errors.append(f"Relationship at index {i} missing required field: type")
            
            valid_types = ["owned_by", "owns", "partner", "competitor", "customer", "vendor"]
            if "type" in rel and rel["type"] not in valid_types:
                errors.append(f"Relationship at index {i} has invalid type: {rel['type']}")
    
    is_valid = len(errors) == 0
    return is_valid, errors

def merge_entity_data(existing_data, new_data):
    """
    Merge new entity data with existing data, preserving existing fields
    unless new data has more specific information
    
    Args:
        existing_data (dict): Existing entity data
        new_data (dict): New entity data to merge
    
    Returns:
        dict: Merged entity data
    """
    if not existing_data:
        return new_data
    
    merged_data = existing_data.copy()
    
    # Update simple fields if they exist in new data and are not None/empty
    for field in ["name", "type", "parent", "revenue"]:
        if field in new_data and new_data[field]:
            merged_data[field] = new_data[field]
    
    # Merge subsidiaries
    if "subsidiaries" in new_data and new_data["subsidiaries"]:
        if "subsidiaries" not in merged_data:
            merged_data["subsidiaries"] = []
        
        # Add new subsidiaries that don't already exist
        for subsidiary in new_data["subsidiaries"]:
            if subsidiary not in merged_data["subsidiaries"]:
                merged_data["subsidiaries"].append(subsidiary)
    
    # Merge relationships
    if "relationships" in new_data and new_data["relationships"]:
        if "relationships" not in merged_data:
            merged_data["relationships"] = []
        
        # Create a set of existing relationships for faster lookup
        existing_relationships = {(rel["target"], rel["type"]) for rel in merged_data["relationships"]}
        
        # Add new relationships that don't already exist
        for rel in new_data["relationships"]:
            if ("target" in rel and "type" in rel and 
                (rel["target"], rel["type"]) not in existing_relationships):
                merged_data["relationships"].append(rel)
                existing_relationships.add((rel["target"], rel["type"]))
    
    return merged_data

# For testing
if __name__ == "__main__":
    # Test entity data
    test_entity = {
        "name": "Test Healthcare",
        "type": "Payer",
        "parent": "Test Group",
        "revenue": "10B",
        "subsidiaries": ["Test Subsidiary 1", "Test Subsidiary 2"],
        "relationships": [
            {"target": "Test Group", "type": "owned_by"},
            {"target": "Test Partner", "type": "partner"}
        ]
    }
    
    # Test saving and loading
    save_entity_json(test_entity, "data/entities/test_healthcare.json")
    loaded_entity = load_entity_json("data/entities/test_healthcare.json")
    
    # Test validation
    is_valid, errors = validate_entity_json(loaded_entity)
    print(f"Entity valid: {is_valid}")
    if not is_valid:
        for error in errors:
            print(f"- {error}")
