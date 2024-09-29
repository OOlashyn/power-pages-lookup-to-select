---
title: Results manipulation
description: Explains how to manipulate results before presenting them to a user
---

From time to time you need to change retrieved results before presenting them to a user - removing certain options, adding additional options or other types of manipulations. To do so you can perform your data tranformation in your `getData` function before passing results to the `successHandler`.

For example: we need to allow the user to select his country of origin. We want to show to the user **Prefer Not to Say** option as the first one no matter what they type for the search. To do so we can returned our response sorted ascending by name and reshuffle options programmatically using the following code:

```javascript
function getEmployerByName(countryName, successHandler, errorHandler) {
    const select = `$select=dwctst_name,dwctst_countryid&$orderby=dwctst_name asc`;
    // if countryName is present add filter that name of the country should start with the
    // provided search term
    const filter = countryName ? `&$filter=startswith(dwctst_name,'${countryName}')` : "";
    const options = select+filter;
    webapi.safeAjax({
        type: "GET",
        url: `/_api/dwctst_countries?${options}`,
        contentType: "application/json",
        headers: {
            "Prefer": "odata.include-annotations=*"
        },
        success: function(data) {
            const PREFER_NOT_SAY_OBJ = {
                dwctst_countryid: "41065f31-06fb-44b2-b2ec-50d5ee4cb00a",
                dwctst_name: "Prefer Not to Say"
            };

            const preferNotToSayIndex = data.value.findIndex(el => el.dwctst_countryid == PREFER_NOT_SAY_OBJ.dwctst_countryid);
            
            // remove Prefer not to say option if exists
            if(preferNotToSayIndex != -1) {
                data.value.splice(preferNotToSayIndex, 1);
            }

            // set Prefer not to say option at the beggining of the array
            data.value.unshift(PREFER_NOT_SAY_OBJ);

            successHandler(data);
        },
        error: errorHandler
    });
}

$(document).ready(function(){
    $("#dwctst_countryofbirth").lookupToSelect({
        getData: getCountryByName,
        placeholder: 'Search for a country',
        idFieldName: 'dwctst_countryid',
        textFieldName: 'dwctst_name',
        targetTableLogicalName: 'dwctst_country'
    });
});
```