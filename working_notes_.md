# Ivy Homes Assignment — Q1 to Q10 Working Notes

## Q1 — total_listing_records

Answer: 4100

Method:
- Fetched /v1/listings using offset-based pagination.
- Used limit=50.
- Continued until has_more=false.
- Counted 4100 retrieved records.
- All 4100 listing_ids were unique.

Important observation:
- API reports total=3746.
- Actual retrievable records = 4100.
- offset=3746 still returned 50 records.
- offset=4100 returned 0 records.

Conclusion:
- Q1 answer = 4100.

Evidence:
- data/listings.json
- scripts/fetch_data.js


## Q2 — unique_properties

Answer: 4100

Method:
- Documentation states each listing corresponds to exactly one physical property.
- No property_id exists in the listing object.
- All 4100 listing_ids are unique.
- Duplicate listing_url groups = 0.
- Strong duplicate-record signature produced 0 duplicate groups.
- Same coordinates were found for some records, but those records represented
  different units/listings, so coordinates cannot be used as property identity.
- project_id represents a project, not an individual property.

Conclusion:
- Q2 answer = 4100.

And we have an important finding already

Don't lose this one:

Finding — Listings pagination

Documented:
page + limit, maximum 200.

Actual:
page is ignored; API uses offset + limit, and effective maximum limit is 50.

Evidence we already tested:

page=1 → offset=0
page=2 → offset=0
page=2 returned same first listing

offset=5 → different first listing

limit=200 → API returned only 50 records

This should eventually go into your final submission.json under findings.

Another important finding

Documented total: 3746

Actually retrievable: 4100

That's potentially another finding around completeness/data quality. We should preserve it now and decide its exact wording later after we've finished the questions.

## Q3 — active_listings

Answer: 3233

Method:
- Used all 4100 records from data/listings.json.
- Counted records where is_live === true.

Result:
- Active listings = 3233
- Inactive listings = 867
- Total retrievable records = 4100

Conclusion:
- Q3 answer = 3233.

Important observation:
- The API documentation says /v1/listings returns only active listings.
- The actual API returned 867 records with is_live=false.
- Therefore the documentation is incorrect on this point.

## Q4 — corrupt_listing_ids

Current answer: 9 IDs

Candidate IDs (sorted):
- 100-4000457
- DWE-4001424
- DWE-4002374
- MAG-4000145
- SQU-4002483
- ZER-4000021
- ZER-4001287
- ZER-4001669
- ZER-4001686

Method:
- Searched all retrievable listing records for impossible numeric values.
- Found 9 records with negative prices.
- Each of these records has otherwise internally plausible numeric fields:
  floor <= total_floors
  carpet_area < super_built_up_area
  positive bedroom/bathroom/areas.
- Therefore negative price is an unambiguous corruption signal.

Additional anomaly groups found:
- 9 records where floor > total_floors.
- 9 records where carpet_area > super_built_up_area.
- These groups do not overlap with the negative-price group.
- Further investigation may be needed if Q4 is intended to include multiple corruption classes.

## Q4 — corrupt_listing_ids

Status: Under investigation

Current candidate: 9 negative-price IDs

Candidate IDs (sorted):
- 100-4000457
- DWE-4001424
- DWE-4002374
- MAG-4000145
- SQU-4002483
- ZER-4000021
- ZER-4001287
- ZER-4001669
- ZER-4001686

Method:
- Searched all retrievable listing records for impossible numeric values.
- Found 9 records with negative prices.
- Each of these records has otherwise internally plausible numeric fields:
  floor <= total_floors
  carpet_area < super_built_up_area
  positive bedroom/bathroom/areas.
- Negative price is therefore an unambiguous corruption signal.

Additional anomaly groups found:
- 9 records where floor > total_floors.
- 9 records where carpet_area > super_built_up_area.
- These groups do not overlap with the negative-price group.

Conclusion so far:
- The 9 negative-price records are the strongest candidate for Q4.
- Final Q4 answer is not locked yet because three independent 9-record anomaly groups were found.

Status: COMPLETE

Conclusion:
- Q4 answer = the 9 negative-price listing IDs.
- Negative price is an unambiguous impossible value.
- The other two 9-record groups are retained as additional data-quality observations,
  but are not included in Q4 because they form separate anomaly classes.

  ## Q5 — total_monthly_rent

**Status: COMPLETE**

**Answer:**

* `total_monthly_rent = 5853000 INR`
* Thoraipakkam rental records found = `161`

**Endpoint tested:**

```text
GET /v1/rentals
```

**Pagination used:**

```text
limit=50
offset=0, 50, 100, ... , 1500
```

**API response behavior:**

* API reported `total = 1416`
* However, the API continued returning records beyond offset 1400.
* `offset=1450` returned `count=50` and `has_more=true`.
* `offset=1500` returned `count=50` and `has_more=false`.
* Therefore, the API's `total=1416` should not be treated as the actual retrievable-record boundary.
* `has_more=false` was used as the stopping condition.

**Filter/calculation:**

```javascript
if (r.locality?.toLowerCase() === "thoraipakkam") {
    sum += Number(r.price) || 0;
    count++;
}
```

**Final calculation:**

```text
Matching Thoraipakkam rental records = 161
Sum of price = ₹5,853,000
```

**Postman method:**

* Collection: `ivy_homes_1`
* Collection variables reset before final run:

  * `offset = 0`
  * `thoraipakkam_count = 0`
  * `thoraipakkam_rent = 0`
* Rentals request saved inside the collection.
* Collection Runner used with only the Rentals request checked.
* Iterations = 31.
* Runner completed successfully.
* Final variables:

  * `offset = 1500`
  * `thoraipakkam_count = 161`
  * `thoraipakkam_rent = 5853000`

**Important correction:**
An earlier manual run produced `163` records / `₹6,008,400`, but the same offset was accidentally executed multiple times after pagination stopped advancing. Those values were discarded. The final Runner result above was obtained from a clean reset and should be used.

**Evidence to retain:**

* `/v1/rentals` request
* `limit=50`
* offset-based pagination
* Runner configuration (31 iterations)
* final collection variables
* observation that API `total=1416` conflicts with continued pagination beyond that boundary

**Potential API finding:**
The `/v1/rentals` endpoint reports `total=1416` but continues returning records at offsets beyond the reported total, making the reported total unreliable as a completeness boundary.

### Q6 — Average Price per Sqft for 2BHK in Thoraipakkam

**Definition:**
Mean of `price / carpet_area` for live 2BHK listings in Thoraipakkam, excluding Q4 corrupt listing IDs. Q9 fake listing IDs are still pending and will be excluded before the final answer.

**Pagination:**

* Endpoint: `GET /v1/listings`
* `limit = 50`
* Used `offset` pagination from `0` through `4050`
* Collection Runner used for automatic pagination

**Filtering conditions:**

* `locality = Thoraipakkam`
* `bedroom = 2`
* `is_live = true`
* Excluded 9 Q4 corrupt listing IDs

**Raw calculation:**

* Matching listings: `104`
* Sum of `price / carpet_area`: `1,802,349.2147616015`
* Raw mean: `17,330.280911169244`
* Raw mean rounded to 2 decimals: `17,330.28`



**Status:**
Raw Q6 calculation completed. Final Q6 answer must be recalculated after identifying and excluding Q9 fake listing IDs.
<!-- FINAL: -->
Count: 104
Sum of price / carpet_area: 1,802,349.2147616015
Average: ₹17,330.28/sq ft


<!-- Q.9 -->
<!-- evidence : -->
100-4000342
100-4000711
100-4001389
100-4001474
100-4001741
DWE-4001931
DWE-4003537
DWE-4003972
MAG-4000373
MAG-4003093
MAG-4003738
SQU-4000109
SQU-4000265
SQU-4002728
ZER-4001962
ZER-4002312


<!-- Q7 Final -->
Costliest project: P40231
Project name: Century Habitat
price_max: 99.8

Since Q7 has ±1% tolerance, 99.8 is your answer.

Save the evidence: the final Runner console output + the project record for P40231.


<!-- Q.8 -->
Q8 — Listings in Last 7 Days

REFERENCE: 2026-09-10T00:00:00+05:30
Window: 2026-09-03T00:00:00+05:30 to 2026-09-10T00:00:00+05:30
Source: data/listings.json
Matching listings: 122

Q10 — projects_with_wrong_listing_count

Answer: 336

Method:
- Fetched all 4100 retrievable records from GET /v1/listings using pagination.
- Counted listings grouped by project_id.
- Fetched all 420 projects from GET /v1/projects using limit=50 and offsets 0, 50, ..., 400.
- Compared each project's reported total_listings against the actual retrievable listing count for that project_id.
- Projects with mismatching values: 336.

Formula:
reported project.total_listings != actual count of retrievable listings with matching project_id

Evidence:
- /v1/listings: 4100 retrievable records
- /v1/projects: 420 projects
- project_counts collection variable: actual listing counts grouped by project_id
- project_mismatches collection variable: 336 mismatching projects