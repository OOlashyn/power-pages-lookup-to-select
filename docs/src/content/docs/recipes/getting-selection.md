---
title: Retrieving selection
description: Retrives selection from Select2 with additional metadata programmatically
---

Similarly to the OOB Select2 you can retrieve current selection (with all additional metadata). To do so you need to call `.select2('data')` function on the id of your lookup with custom `_dwcSelect2` postfix.

```javascript
$(`${fieldId}_dwcSelect2`).select2('data');
```

The result will be an array of selected options (as Select2 allows for multi-selection configuration).

```javascript
[
    {
        id: '26d38746-0dac-45bb-bff9-057239876571',
        text: 'Google',
        dwc_name: 'Google',
        dwc_address: '1600 Amphitheatre Parkway, Mountain View, California'
        dwc_employerid: '26d38746-0dac-45bb-bff9-057239876571',
        dwc_industrycode: '864000'
        'dwc_industrycode@OData.Community.Display.V1.FormattedValue': 'Technology'
    }
]
```