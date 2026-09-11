# Location-Aware Guidance & Privacy Specification

This document details TheervuAI's location handling, jurisdictional filtering, and strict privacy principles.

---

## 1. Privacy-First Location Architecture

TheervuAI adheres to a strict user-controlled location model:
- **Zero Automatic Geolocation**: The application does **NOT** invoke `navigator.geolocation.getCurrentPosition()` or request browser location permissions.
- **Zero IP Geolocation**: User IP addresses are never resolved to physical locations for tracking.
- **100% User-Controlled**: Location filtering is driven exclusively by manual user selection via `LocationSelector` dropdowns.
- **Instant Reset**: Citizens can reset their active location filter back to `All India` with a single click.

---

## 2. Directory Coverage: 36 States & Union Territories

`lib/location/states.ts` maintains a centralized registry of all 28 Indian States and 8 Union Territories with official portal domains and key administrative districts:

### States
Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal.

### Union Territories
Andaman and Nicobar Islands, Chandigarh, Dadra and Nagar Haveli and Daman and Diu, Delhi, Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry.

---

## 3. Jurisdictional Matching Logic

The matching function `isLocationMatched(serviceState, serviceDistrict, userState, userDistrict)` applies the following rules:

1. **National Neutrality**: If `userState` is empty or `All India`, all national and state services are accessible.
2. **Federal Services**: If `serviceState` is `All India` (e.g. Passports, Aadhaar, PM-JAY, RTI, PAN), it is always displayed regardless of the selected state.
3. **State Alignment**: State-specific services (e.g. TNPDS smart cards, Community certificates) appear only when the matching state is selected.
4. **District Specificity**: If a municipal service specifies a district, it matches when the citizen's selected district matches or when no district is specified.
