## Customer (Salesforce)

id string
tier silver | gold | bronze

## Impression (Hubspot)

id string
name string
sales_force_id string
impressions number

SELECT I.name FROM CUSTOMER C, Impression I WHERE C.id = I.sales_force_id and I.impressions > 10 and C.tier = 'gold'

1. how to you build indices on this table?
2. does it not matter because its small data
