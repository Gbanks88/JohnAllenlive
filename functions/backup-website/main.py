import datetime
from google.cloud import storage

def backup_website(event, context):
    """Backup the website bucket to a backup bucket daily."""
    source_bucket_name = 'cool-ascent-450601-d1-fashion'
    backup_bucket_name = f'{source_bucket_name}-backup'
    
    # Create a timestamp for the backup
    timestamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    
    # Initialize the storage client
    storage_client = storage.Client()
    
    # Get the source bucket
    source_bucket = storage_client.get_bucket(source_bucket_name)
    
    # Get or create the backup bucket
    try:
        backup_bucket = storage_client.get_bucket(backup_bucket_name)
    except Exception:
        backup_bucket = storage_client.create_bucket(
            backup_bucket_name,
            location='us-central1'
        )
    
    # Copy all objects to backup bucket with timestamp prefix
    for blob in source_bucket.list_blobs():
        source_blob = source_bucket.get_blob(blob.name)
        backup_name = f'backup-{timestamp}/{blob.name}'
        
        # Copy the object
        backup_bucket.copy_blob(
            source_blob,
            backup_bucket,
            backup_name
        )
    
    # Delete backups older than 30 days
    cutoff_date = datetime.datetime.now() - datetime.timedelta(days=30)
    for blob in backup_bucket.list_blobs():
        if blob.time_created < cutoff_date:
            blob.delete()
    
    return f'Backup completed at {timestamp}'
