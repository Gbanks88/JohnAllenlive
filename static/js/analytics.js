// Ad Performance Tracking
function trackAdImpression(adSlot, position) {
    gtag('event', 'ad_impression', {
        'ad_slot': adSlot,
        'position': position,
        'page_type': window.location.pathname
    });
}

function trackAdClick(adSlot, position) {
    gtag('event', 'ad_click', {
        'ad_slot': adSlot,
        'position': position,
        'page_type': window.location.pathname
    });
}

// User Engagement Tracking
function trackScholarshipSearch(filters) {
    gtag('event', 'scholarship_search', {
        'field_of_study': filters.field || 'any',
        'min_amount': filters.minAmount || 0,
        'max_amount': filters.maxAmount || 'any',
        'deadline_after': filters.deadlineAfter || 'any'
    });
}

function trackScholarshipClick(scholarshipId, scholarshipName) {
    gtag('event', 'scholarship_click', {
        'scholarship_id': scholarshipId,
        'scholarship_name': scholarshipName
    });
}

function trackResourceDownload(resourceName) {
    gtag('event', 'resource_download', {
        'resource_name': resourceName,
        'page': window.location.pathname
    });
}

// User Engagement Features
function initializeEngagementFeatures() {
    // Save search preferences
    const savedFilters = localStorage.getItem('scholarshipFilters');
    if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        document.getElementById('fieldOfStudy').value = filters.field || '';
        document.getElementById('minAmount').value = filters.minAmount || '';
        document.getElementById('maxAmount').value = filters.maxAmount || '';
        document.getElementById('deadlineAfter').value = filters.deadlineAfter || '';
    }

    // Track time spent on page
    let startTime = new Date();
    window.addEventListener('beforeunload', () => {
        const endTime = new Date();
        const timeSpent = Math.round((endTime - startTime) / 1000);
        gtag('event', 'time_spent', {
            'page': window.location.pathname,
            'seconds': timeSpent
        });
    });
}

// Initialize features when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEngagementFeatures);

// Save search filters
function saveSearchFilters() {
    const filters = {
        field: document.getElementById('fieldOfStudy').value,
        minAmount: document.getElementById('minAmount').value,
        maxAmount: document.getElementById('maxAmount').value,
        deadlineAfter: document.getElementById('deadlineAfter').value
    };
    localStorage.setItem('scholarshipFilters', JSON.stringify(filters));
    trackScholarshipSearch(filters);
}

// Newsletter subscription tracking
function trackNewsletterSignup(email) {
    gtag('event', 'newsletter_signup', {
        'page': window.location.pathname
    });
}
