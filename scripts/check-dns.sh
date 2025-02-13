#!/bin/bash

# Configuration
DOMAIN="johnallens.live"
EXPECTED_IP="34.54.92.80"
CHECK_INTERVAL=300  # 5 minutes

while true; do
    echo "Checking DNS propagation for $DOMAIN..."
    
    # Get current IP from DNS
    CURRENT_IP=$(dig +short $DOMAIN)
    
    if [ "$CURRENT_IP" == "$EXPECTED_IP" ]; then
        echo "DNS has propagated! $DOMAIN now points to $CURRENT_IP"
        
        # Check SSL certificate
        echo "Checking SSL certificate..."
        SSL_STATUS=$(gcloud compute ssl-certificates describe johnallens-fashion-cert --global --format="get(managed.status)")
        
        if [ "$SSL_STATUS" == "ACTIVE" ]; then
            echo "SSL certificate is active!"
            echo "Site should be accessible at https://$DOMAIN"
            exit 0
        else
            echo "SSL certificate status: $SSL_STATUS"
            echo "Waiting for SSL certificate to become active..."
        fi
    else
        echo "DNS not propagated yet. Current IP: $CURRENT_IP (Expected: $EXPECTED_IP)"
    fi
    
    sleep $CHECK_INTERVAL
done
