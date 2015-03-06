# tableScroll

## What it does?
Converts a table to a 2-dimensional-scrolling table (no iframes are used).

## How it works?
1. Table must be already rendered in the DOM.
2. Table must have \<thead> and \<tbody>. All children of a row in \<thead> must be \<th> and all children of a row in \<tbody> must be \<td>
3. Optionally, table can also have a \<tfoot> that will also be ported to the resulted table
4. Options are pretty straight forward: (view demo/index.html for an example)

```javacript
$(document).ready(function() {
// find table element and apply plugin
  $('.tbl-scroll').tableScroll({
    height : 200,             // height of the result table
    standardHeight : 200,     // standardHeight is 500 by default, height is determined based on standardHeight
    fixedCols : 3,            // number of fixed columns (left to right) - can also be 0
    classes : '',             // classes to be added to final table - list of classes (separated by space)
    sortable : true,          // columns are sortable or not (false by default)
    tooltip : true,           // tooltip for header cells - uses tipsy.js to generate tooltip
    gravity : 's'             // tooltip option - tooltip orientation
  });
});
```
