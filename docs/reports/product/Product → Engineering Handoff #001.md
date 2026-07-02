# Product → Engineering Handoff #001

**Date:** July 2, 2026

**Product Lead:** ChatGPT

---

# Executive Summary

Engineering has successfully established a scalable technical foundation for Northwest U-Pick. Product believes the project has reached an important transition point: future success will depend less on building new features and more on becoming the most trusted source of harvest information.

The product vision remains clear:

> **Help people confidently decide where to go U-pick today.**

Every engineering decision should reinforce that objective.

---

# Engineering Feedback

Product has reviewed the current architecture and direction.

### Assessment

**Overall Direction:** 🟢 Excellent

Engineering appears to be building systems that support the product vision rather than allowing technical complexity to drive feature development.

The emphasis on backend business logic, normalized data, confidence scoring, and service-layer architecture aligns well with the long-term goals of the platform.

Continue protecting this architecture.

---

# Product Decisions

## 1. Gold Standard Farm Definition

Engineering requested clarification on what defines a "Gold Standard" farm.

Product defines success as:

> A user should not need to visit the farm's website after viewing our farm page.

Every Gold Standard farm should answer six categories of questions.

### Worth the Trip

* Worth the Drive score
* Harvest status
* Confidence score
* Recent visitor reports
* Current season photos

### What Can I Pick?

* Available crops
* Current availability
* Estimated peak dates
* Estimated end of season

### Cost

* U-pick pricing
* Admission fees
* Container fees
* Minimum purchase requirements

### Family Experience

* Kid friendly
* Wagon friendly
* Parking
* Restrooms
* Food availability
* Accessibility

### Visit Planning

* Hours
* Reservation requirements
* Accepted payment methods
* Weather considerations
* Farm rules
* Pet policy

### Trust Indicators

* Last updated timestamp
* Information sources
* Confidence level
* Number of recent reports

If users consistently leave the app to verify information elsewhere, the profile is incomplete.

---

## 2. Launch Strategy

Product strongly recommends:

**35 exceptional farms**

instead of

**200 partially complete farms.**

Quality creates trust.

Trust creates repeat users.

Repeat users create community.

Community creates defensible data.

---

## 3. Primary Product Message

Engineering requested guidance on which trust indicators deserve the most emphasis.

Product ranking:

1. Worth the Drive
2. Confidence Score
3. Last Updated
4. Source Attribution
5. Freshness

Users care about decisions—not metrics.

"Worth the Drive" should become the headline recommendation.

Confidence should explain the recommendation rather than replace it.

---

## 4. Version 1 User Journey

Engineering proposed:

> Family opens the app on Saturday morning and decides where to go within 60 seconds.

Product approves with one refinement.

**North Star Journey**

> A family opens Northwest U-Pick on Saturday morning and feels confident they have selected the best nearby destination within 60 seconds.

Confidence—not speed alone—is the outcome we should optimize.

---

# Product Concerns

## Avoid Becoming "Yelp for Farms"

Product recommends avoiding traditional review systems.

Instead, prioritize structured field reports such as:

* Picked 18 lbs in two hours
* North field producing heavily
* Blueberries at peak
* Strawberries nearly finished
* Parking filled by 10 AM

These reports provide significantly more value than generic star ratings.

---

## Resist Feature Expansion

Every proposed feature should answer one question:

**Does this help someone decide where to pick today?**

If the answer is no, it should be deferred until after Version 1.

Maintaining product focus is more valuable than expanding scope.

---

# New Product Initiative

## Harvest Confidence Loop

Product proposes treating every recommendation as a conclusion supported by multiple independent signals.

Potential inputs include:

* Official farm updates
* Historical harvest timing
* Weather conditions
* Crop calendars
* Visitor reports
* Recent photos
* Manual verification

Rather than presenting recommendations as unexplained facts, the application should communicate why it believes a recommendation is trustworthy.

This transparency has the potential to become one of Northwest U-Pick's strongest competitive advantages.

---

# Strategic Observation

Product agrees with Engineering's assessment that the primary challenge has shifted.

The bottleneck is no longer software development.

The bottleneck is now:

* Data quality
* Data freshness
* Data coverage
* User trust

Engineering should continue investing in systems that improve these areas before pursuing additional feature expansion.

---

# Product Priorities (Next Iteration)

Priority 1

* Define and build the first Gold Standard Farm profile (Harvold Berry Farm).

Priority 2

* Design a scalable data acquisition and verification pipeline.

Priority 3

* Expand Harvest Intelligence using multiple independent confidence signals.

Priority 4

* Design lightweight community reporting focused on harvest conditions rather than traditional reviews.

---

# Product North Star

Northwest U-Pick should not become the largest farm directory.

It should become the most trusted harvest intelligence platform in the Pacific Northwest.

Every engineering decision should move the platform closer to that objective.

---

Prepared by

Product Lead

Northwest U-Pick
