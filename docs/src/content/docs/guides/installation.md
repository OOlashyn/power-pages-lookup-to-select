---
title: Installation
description: How to install LtS
---

In order to use Lookup to Select you must include Select2 library as well as configure your Power Pages site. To find more about Select2 please visit [Select2 documentation page](https://select2.org/).

## Using libraries from CDN

One of the easiest way to get LtS and Select2 is to grab them from CDN. Copy following lines of code and include them in the HTML part of your Web Page.

```html
<!-- Adding Select2 -->
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<!-- Adding LtS -->
<script src="https://cdn.jsdelivr.net/npm/power-pages-lookup-to-select@1.0.0/src/index.min.js"></script>
```

## Manual addition

If you cannot use CDN you can always get the latest release from Github repository for both [LtS](https://github.com/OOlashyn/power-pages-lookup-to-select/releases) and [Select2](https://github.com/select2/select2/tags), upload css and js as Web Files and serve them as native part of your Power Pages site.

```html
<!-- Adding Select2 -->
<link href="<powerpages-base>/path/to/select2.min.css" rel="stylesheet" />
<script src="<powerpages-base>/path/to/select2.min.js"></script>
<!-- Adding LtS -->
<script src="<powerpages-base>/path/to/power-pages-lookup-to-select.js"></script>
```

## Power Pages configuration

LtS uses Power Pages Web API to query the data shown in the lookup. Web API for the specified tables needs to be enabled and user should have all necessary permissions.

To learn more about Power Page Web API and its configuration see [official documentation](https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview) from Microsoft.
