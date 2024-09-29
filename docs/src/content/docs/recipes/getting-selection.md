---
title: Retrieving selection
description: Retrives selection from Select2 with additional metadata programmatically
---

Similarly to the OOB Select2 you can retrieve current selection (with all additional metadata). To do so you need to call `.select2('data')` function on the id of your lookup with custom `_dwcSelect2` postfix.

```javascript
$(`#${fieldId}_dwcSelect2`).select2('data');
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

This can be useful when you need to get additional details and act on them after user makes his selection.

```javascript
function getEmployerByName(employerName, successHandler, errorHandler) {
    const select = `$select=accountid,name,_dwctst_country_value,industrycode&$orderby=name asc`;
    const filter = employerName ? `&$filter=startswith(name,'${employerName}')` : "";
    const options = select+filter;
    webapi.safeAjax({
        type: "GET",
        url: `/_api/accounts?${options}`,
        contentType: "application/json",
        headers: {
            "Prefer": "odata.include-annotations=*"
        },
        success: successHandler,
        error: errorHandler
    });
}

$(document).ready(function(){
    $("#dwctst_employer").lookupToSelect({
        getData: getEmployerByName,
        placeholder: 'Search for an employer',
        idFieldName: 'accountid',
        textFieldName: 'name',
        targetTableLogicalName: 'account'
    });

    $("#dwctst_employer").on("change", function() {
        // get selected employers array
        const employerResultArr = $(`#dwctst_employer_dwcSelect2`).select2('data');
        // get selected employer object
        const employerResult = employerResultArr[0];
        
        const employerCountry = employerResult["_dwctst_country_value@OData.Community.Display.V1.FormattedValue"];
        
        alert(`Selected employer country is ${employerCountry}`);
    });
});
```