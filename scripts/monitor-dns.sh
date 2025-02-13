#!/bin/bash

# Configuration
DOMAIN="johnallens.live"
EXPECTED_IP="34.54.92.80"
CHECK_INTERVAL=300  # 5 minutes

check_record() {
    local record_type=$1
    local expected=$2
    local name=$3
    
    echo "Checking $record_type record for $name..."
    result=$(dig +short $record_type $name)
    
    if [ -n "$result" ]; then
        echo "✓ $record_type record found: $result"
        if [ -n "$expected" ] && [ "$result" != "$expected" ]; then
            echo "⚠️  Warning: Expected $expected, got $result"
            return 1
        fi
    else
        echo "✗ No $record_type record found"
        return 1
    fi
    return 0
}

check_ssl() {
    echo "Checking SSL certificate..."
    ssl_check=$(curl -sI https://$DOMAIN | grep "HTTP/")
    if [[ $ssl_check == *"200"* ]]; then
        echo "✓ SSL certificate is valid"
        return 0
    else
        echo "✗ SSL certificate issue: $ssl_check"
        return 1
    fi
}

check_dnssec() {
    echo "Checking DNSSEC..."
    dnssec_check=$(dig +dnssec $DOMAIN | grep -c "RRSIG")
    if [ $dnssec_check -gt 0 ]; then
        echo "✓ DNSSEC is active"
        return 0
    else
        echo "✗ DNSSEC not found"
        return 1
    fi
}

while true; do
    echo "=== DNS Health Check for $DOMAIN ==="
    echo "Time: $(date)"
    echo "----------------------------------------"
    
    # Check A records
    check_record "A" "$EXPECTED_IP" "$DOMAIN"
    check_record "A" "$EXPECTED_IP" "www.$DOMAIN"
    
    # Check MX records
    check_record "MX" "" "$DOMAIN"
    
    # Check TXT records (SPF & DMARC)
    check_record "TXT" "" "$DOMAIN"
    check_record "TXT" "" "_dmarc.$DOMAIN"
    
    # Check DNSSEC
    check_dnssec
    
    # Check SSL
    check_ssl
    
    echo "----------------------------------------"
    echo "Next check in $(($CHECK_INTERVAL/60)) minutes..."
    echo ""
    
    sleep $CHECK_INTERVAL
done
