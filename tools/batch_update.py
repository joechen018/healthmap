#!/usr/bin/env python3
"""
Batch update script for HealthMap.

This script processes multiple healthcare entities in batch.
"""

import os
import sys
import csv
import argparse
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add the parent directory to the path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the process_entity function from the backend
from backend.main import process_entity

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def process_entity_wrapper(entity_name, update_existing=True):
    """
    Wrapper function for process_entity to handle exceptions
    
    Args:
        entity_name (str): Name of the healthcare entity
        update_existing (bool): Whether to update existing entity data
        
    Returns:
        tuple: (entity_name, success, error_message)
    """
    try:
        result = process_entity(entity_name, update_existing=update_existing)
        if "error" in result:
            return (entity_name, False, result["error"])
        return (entity_name, True, None)
    except Exception as e:
        return (entity_name, False, str(e))

def batch_process(input_file=None, entity_list=None, update_existing=True, max_workers=4):
    """
    Process multiple healthcare entities in batch
    
    Args:
        input_file (str, optional): Path to CSV file with entity names
        entity_list (list, optional): List of entity names to process
        update_existing (bool): Whether to update existing entity data
        max_workers (int): Maximum number of concurrent workers
        
    Returns:
        tuple: (success_count, failure_count, failures)
    """
    entities = []
    
    if input_file:
        # Read entities from CSV file
        try:
            with open(input_file, 'r') as f:
                reader = csv.reader(f)
                
                # Check if the file has a header
                has_header = csv.Sniffer().has_header(f.read(1024))
                f.seek(0)
                
                # Skip header if it exists
                if has_header:
                    next(reader)
                
                for row in reader:
                    if row and row[0].strip():
                        entities.append(row[0].strip())
        except Exception as e:
            logger.error(f"Error reading CSV file: {str(e)}")
            return (0, 0, [])
    elif entity_list:
        entities = entity_list
    else:
        logger.error("Either input_file or entity_list must be provided")
        return (0, 0, [])
    
    if not entities:
        logger.warning("No entities to process")
        return (0, 0, [])
    
    logger.info(f"Processing {len(entities)} entities...")
    
    success_count = 0
    failure_count = 0
    failures = []
    
    # Process entities in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_entity = {
            executor.submit(process_entity_wrapper, entity, update_existing): entity
            for entity in entities
        }
        
        # Process results as they complete
        for future in as_completed(future_to_entity):
            entity_name, success, error = future.result()
            
            if success:
                logger.info(f"✓ Successfully processed {entity_name}")
                success_count += 1
            else:
                logger.error(f"✗ Error processing {entity_name}: {error}")
                failures.append((entity_name, error))
                failure_count += 1
    
    logger.info(f"Batch processing complete: {success_count} succeeded, {failure_count} failed")
    
    return (success_count, failure_count, failures)

def main():
    """
    Main entry point for the script
    """
    parser = argparse.ArgumentParser(description="Batch process healthcare entities")
    parser.add_argument("-f", "--file", help="Path to CSV file with entity names")
    parser.add_argument("-e", "--entities", nargs="+", help="List of entity names to process")
    parser.add_argument("--no-update", action="store_true", help="Don't update existing entity data")
    parser.add_argument("-w", "--workers", type=int, default=4, help="Maximum number of concurrent workers")
    parser.add_argument("-o", "--output", help="Output file for results (CSV)")
    
    args = parser.parse_args()
    
    if not args.file and not args.entities:
        parser.error("Either --file or --entities must be provided")
    
    # Process entities
    success_count, failure_count, failures = batch_process(
        args.file, args.entities, not args.no_update, args.workers
    )
    
    # Write results to output file if specified
    if args.output and (success_count > 0 or failure_count > 0):
        try:
            with open(args.output, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["Entity", "Status", "Error"])
                
                # Write successes
                for entity in (args.entities or []):
                    if entity not in [f[0] for f in failures]:
                        writer.writerow([entity, "Success", ""])
                
                # Write failures
                for entity, error in failures:
                    writer.writerow([entity, "Failure", error])
            
            logger.info(f"Results written to {args.output}")
        except Exception as e:
            logger.error(f"Error writing results to {args.output}: {str(e)}")
    
    # Return success if all entities were processed successfully
    return 0 if failure_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
