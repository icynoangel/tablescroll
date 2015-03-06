/*
 * jQuery table.tableScroll plugin
 * Version 1.0 (6-mar-2015)
 * @requires jQuery v1.3.2 or later (http://jquery.com)
 * @requires jQuery throttle / debounce - v1.1 - http://benalman.com/projects/jquery-throttle-debounce-plugin/
 
 * Copyright (c) 2015 icynoangel
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */
(function($) {
  
    var bindings = [],
    
    getScrollBarWidth = function() {
        var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body'),
            widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
        $outer.remove();
        return 100 - widthWithScroll;
    },
  
    testOptions = function(options) {
        if(typeof options.height == "undefined" || 
           typeof options.standardHeight == "undefined" || 
           typeof options.scrollDiff == "undefined" || 
           typeof options.fixedCols == "undefined" || 
           typeof options.classes == "undefined" || 
           typeof options.sortable == "undefined") {
                throw 'Some of the options are missing';
        }
        var height = parseInt(options.height, 10),
            standardHeight = parseInt(options.standardHeight, 10),
            scrollDiff = parseInt(options.scrollDiff, 10),
            fixedCols = parseInt(options.fixedCols, 10);
        
        if(isNaN(height) || isNaN(standardHeight) || isNaN(scrollDiff) || isNaN(fixedCols)) {
            throw 'Options height, standardHeight, scrollDiff and fixedCols must be integers';
        }
        
        if(fixedCols < 0) {
            throw 'Options fixedCols must be a positive integer or zero';
        }
        
        if(typeof options.classes != "string") {
            throw 'Options classes must be a string';
        }
        
        if(typeof options.sortable != 'boolean') {
            throw 'Options sortable must be boolean';
        }
        
        if(typeof options.tooltip != 'boolean') {
            throw 'Options tooltip must be boolean';
        }
        
        if(options.tooltip == true) {
            if(typeof $.fn.tipsy == "undefined") {
                throw 'Tooltip plugin not loaded';
            }
            if(typeof options.gravity != 'string' ||
               ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].indexOf(options.gravity) == -1) {
                    throw 'Options gravity must be string with one of these values: nw | n | ne | w | e | sw | s | se';
            }
        }
    },
  
    init = function(options) {
        
        var $table = $(this);
    
        if(typeof options == 'object') {
            options = $.extend({}, $.fn.tableScroll.defaults, options);
        } else {
            options = $.extend({}, $.fn.tableScroll.defaults);
        }
        
        testOptions(options);
        
        $table.data('table-scroll-options', options); //.attr('data-options', JSON.stringify(options));
    
        options.scrollDiff = getScrollBarWidth();
         
        var $content = convertTable($table, options);
        
        $table.html($content);
        // remove all classes on table
        $table.removeClass();
        // add specific classes and options classes
        $table.addClass('scrollTable');
        if(options.sortable) {
            $table.addClass('scrollTable-sortable');
        }
        if(options.classes) {
            $table.addClass(options.classes);
        }
        
        setWidths.call(this);
        
        $('.div-table', $table).on('scroll', function() {
            scroll($table, options);
        });
        
        bindResize.call(this);
        
        if(options.sortable) {
            bindSort($table, options);
        }
        if(options.tooltip) {
            bindTooltip($('.scrollTable-tooltip', $table), options.gravity);
        }
    },
    
    bindTooltip = function($elements, orientation) {
        $elements.tipsy({gravity: orientation});
    },
    
    bindSort = function($table, options) {
        var $all = $('.top-row .div-fixed th', $table).add($('.top-row .div-header th', $table));
    
        for(var i=0, len=$all.length; i<len; i++) {
            $($all[i]).data('sort', 'none').data('col-index', i).attr('col-index', i);
        }
                
        $table.off('click.sort').on('click.sort', '.top-row .div-fixed th, .top-row .div-header th', function() {
            var $th = $(this),
                sortType = $th.data('sort');
            
            $all.removeClass('sort-asc sort-desc');
            if(['none', 'desc'].indexOf(sortType) != -1) { 
                sortType = 'asc';
                $th.removeClass('sort-desc').addClass('sort-asc');
            } else {
                sortType = 'desc';
                $th.removeClass('sort-asc').addClass('sort-desc');
            }
            $th.data('sort', sortType);
            sortTable($table, $th.data('col-index'), sortType, options);
        });
    },
    
    sortTable = function($table, colIndex, order, options) {
        var $left = $('.div-cols tbody tr', $table),
            $right = $('.div-table tbody tr', $table),
            newLeft = [], 
            newRight = [],
            $searchList, 
            store = [],
            type = 'number';
            
        if(options.fixedCols >= parseInt(colIndex)+1) {
            $searchList = $left;
        } else {
            $searchList = $right;
            colIndex = colIndex - options.fixedCols;
        }
    
        for(var i=0, len=$left.length; i<len; i++) {
            var sortVal = $.trim($('td:eq('+colIndex+')', $searchList[i]).text()),
                nr = (sortVal.length ? parseFloat(sortVal.replace(',', '', 'gi'), 10) : '');
            
            if(isNaN(nr)) {
                type = 'string';
            }
            //parseFloat(row.cells[0].textContent || row.cells[0].innerText);
            store.push([sortVal, $left[i], $right[i]]);
        }
        
        store.sort(function(a, b) {
            if(type == 'number') {
                a = parseFloat(a[0].replace(',', '', 'gi'), 10);
                b = parseFloat(b[0].replace(',', '', 'gi'), 10);
            } else {
                a = (a[0]+'').toLowerCase();
                b = (b[0]+'').toLowerCase();
            }
            if(order == 'asc') {
                if(a > b) return 1;
                if(a < b) return -1;
            } else {
                if(a < b) return 1;
                if(a > b) return -1;
            }
            return 0;
        });
        
        /*store.sort(function(x, y){
            return x[0] - y[0];
        });*/
        for(var i=0, len=store.length; i<len; i++){
            newLeft.push(store[i][1]);
            newRight.push(store[i][2]);
        }
        
        $('.div-cols tbody', $table).html(newLeft);
        $('.div-table tbody', $table).html(newRight);
        store = null;
    },
        
    //function to support scrolling of title and first column
    scroll = function($table) {
        var scrLeft = $('.div-table', $table).scrollLeft();
        $('.div-header', $table).scrollLeft(scrLeft);
        $('.div-footer', $table).scrollLeft(scrLeft);
        $('.div-cols', $table).scrollTop($('.div-table', $table).scrollTop());
    },    
       
    unique = function() {
        var s4 = function() {
            return Math.floor((1 + Math.random()) * 0x10000)
                       .toString(16)
                       .substring(1);
        };
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },
    
    cleanBindings = function() {
        for(var i=0, len=bindings.length; i<len; i++) {
            if($('table[table-scroll-guid='+bindings[i]+']').length == 0) {
                $(window).off('resize.'+bindings[i]);
                bindings.splice(i, 1);
            }
        }
    },
    
    bindResize = function() {
        var self = this,
            uniq = unique(),
            $table = $(self);
            
        // save uniq string
        bindings.push(uniq);
        $table.attr('table-scroll-guid', uniq);
        
        cleanBindings();
        
        // for each table to which the plugin is applied we have a unique GUID as namespace to bind window resize
        $(window).off('resize.'+uniq);
        $(window).on('resize.'+uniq, $.debounce(250,
                        function () {
                            setWidths.call(self);
                      }));
    },
            
    setWidths = function() {
        
        var $table = $(this),
            options = $table.data('table-scroll-options'),
            mWidth = 0,
            $fcTr = $('.div-cols tr:first', $table),
            $divFixedTable = $('.top-row .div-fixed table', $table),
            $divColsTable = $('.div-cols table', $table),
            $divFixedTableBottom = $('.bottom-row .div-fixed table', $table),
            $tfTr = $('tr', $divFixedTableBottom),
            
            $divHeader = $('.div-header', $table),
            $divFooter = $('.div-footer', $table),
            $parent     = $divHeader.parent(),
            $divTable = $('.div-table', $table);
    

        // determine smaller height of table when config.height is too much
        var thHeight = $('th:first', $divHeader).outerHeight(),
            nbrRows = $('.fixed-right tr:visible', $table).length;
    
        if(thHeight > 0 && thHeight * nbrRows < options.standardHeight) {
            options.height = thHeight * nbrRows;
        } else {
            options.height = options.standardHeight;
        }
        
        // set heights for div-cols and div-table
        $('.div-cols', $table).height(options.height);
        $divTable.height(options.height + options.scrollDiff);

        var arrDom = [],
            arrDim = [];
        $('.top-row th.fixed-th', $table).each(function() {
            var $th = $(this),
                $td = $('td:eq('+$th.index()+')', $fcTr),
                $tf = $('td:eq('+$th.index()+')', $tfTr),
                maxWidth = Math.max(Math.max($th.outerWidth(), $td.outerWidth()), $tf.outerWidth());

            mWidth += maxWidth;
            $th.add($td).add($tf).outerWidth(maxWidth);
        });
        
        $divFixedTable.add($divColsTable).add($divFixedTableBottom).outerWidth(mWidth);

        // fix width of top header and scrollable
        $parent.add($divHeader).add($divTable).add($divFooter).css('width', '');
        
        $parent.css('width', '100%');
        var parentWidth = $parent.outerWidth();
        
        $parent.add($divTable).width(parentWidth);
        $divHeader.width(parentWidth - options.scrollDiff);
        $divFooter.width(parentWidth - options.scrollDiff);
        
        var $divHeaderTable = $('.div-header table', $table),
            $divTableTable = $('.div-table table', $table),
            $divFooterTable = $('.div-footer table', $table);
            //maxWidth = Math.max($divHeaderTable.outerWidth(), $divTableTable.outerWidth());
        
        mWidth = 0;
        var $tbTr = $('tr:first', $divTableTable),
            $tfTr = $('tr:first', $divFooterTable);
        $('tr:first th', $divHeaderTable).each(function() {
            var $th = $(this),
                $td = $('td:eq('+$th.index()+')', $tbTr),
                $tf = $('td:eq('+$th.index()+')', $tfTr),
                maxWidth = Math.max(Math.max($th.outerWidth(), $td.outerWidth()), $tf.outerWidth());

            mWidth += maxWidth;
            $th.add($td).add($tf).outerWidth(maxWidth);
        });
        
        $divHeaderTable.add($divTableTable).add($divFooterTable).outerWidth(mWidth);

        return this;
    },
            
    convertTable = function($table, options) {
        
        /* create following table structure from received dom $table
        <table>
            <!-- fixed top header columns - and left-right movable header -->
            <tr>
                <th>
                    <div class="div-fixed">
                        <table>
                            <thead>
                                <th class="fixed-th">First col header</th>
                                <th class="fixed-th">Second col header</th>
                            </thead>    
                        </table>
                    </div>
                </th>
                
                <th>
                    <div class="div-header">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title1</th>
                                    <th>Title1</th>
                                    <th>Title1</th>
                                </tr>
                            </thead>        
                        </table>
                    </div>
                </th>
            </tr>
        
            <tr>
                <td class="fixed-left">
                    <div class="div-cols">
                        <table>
                            <tr>
                              <td class="fixed-td">First Col row1 </td>
                              <td class="fixed-td">Second Col row1 </td>
                            </tr>
                            <tr>
                              <td class="fixed-td">First Col row2</td>
                              <td class="fixed-td">Second Col row2</td>
                            </tr>
                            <tr>
                              <td class="fixed-td">First Col row3</td>
                              <td class="fixed-td">Second Col row3</td>
                            </tr>
                         </table>
                    </div>
                </td>
    
                <td class="fixed-right">
                    <div class="div-table">
                        <table>
                            <tr>
                                <td>Row1Col1</td>
                                <td>Row1Col2</td>
                                <td>Row1Col3</td>
                            </tr>
                            <tr>
                                <td>Row2Col1</td>
                                <td>Row2Col2</td>
                                <td>Row2Col3</td>
                            </tr>
                            <tr>
                                <td>Row3Col1</td>
                                <td>Row3Col2</td>
                                <td>Row3Col3</td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>*/
        
        
        // construct header row 
        
        /*<tr>
            <th class="fixed-th">First col header</th>
            <th class="fixed-th">Second col header</th>
            <th>
                <div class="div-header">
                    <table>
                        <thead>
                            <tr>
                                <th>Title1</th>
                                <th>Title1</th>
                                <th>Title1</th>
                            </tr>
                        </thead>        
                    </table>
                </div>
            </th>
        </tr>*/
        
        var footer = ($table.find('tfoot').length ? true : false),
            $footerRow,
            $tf;
        
        var $topRow = $('<tr class="top-row"><th><div class="div-fixed"><table><thead><tr></tr></thead></table></div></th></tr>'),
            $th = $table.find('thead:first th');
            //headerPad = config.sortable ? 'style="padding-right: 10px;" ' : '';
            
        if(footer) {
            $footerRow = $('<tr class="bottom-row"><th><div class="div-fixed"><table><tfoot><tr></tr></tfoot></table></div></th></tr>');
            $tf = $table.find('tfoot:first td');
        }
        
        if($th.length) {
            for(var i=0; i<options.fixedCols; i++) {
                $topRow.find('thead tr').append($($th[i]).attr('title', $($th[i]).text()).addClass('scrollTable-tooltip'));
                
                if(footer) {
                    $footerRow.find('tfoot tr').append($tf[i]);
                }
            }
            
            $topRow.find('.div-fixed th').addClass('fixed-th');
            $topRow.append('<th><div class="div-header"><table><thead><tr></tr></thead></table></div></th>');
            
            if(footer) {
                $footerRow.find('.div-fixed td').addClass('fixed-th');
                $footerRow.append('<td><div class="div-footer"><table><tfoot><tr></tr></tfoot></table></div></th>');
            }
            
            for(i=options.fixedCols; i<$th.length; i++) {
                $topRow.find('.div-header thead tr').append($($th[i]).attr('title', $($th[i]).text()).addClass('scrollTable-tooltip'));
                if(footer) {
                    $footerRow.find('.div-footer tfoot tr').append($tf[i]);
                }
            }
        }
        
        var $bottomRow = $('<tr><td class="fixed-left"><div class="div-cols"><table></table></div></td>\n\
                                <td class="fixed-right"><div class="div-table"><table></table></div></td>\n\
                            </tr>');
        // construct bottom row - left part
        var $trLeft, $trRight,
            $divCols = $('.div-cols table', $bottomRow),
            $divTable = $('.div-table table', $bottomRow),
            $tr = $(),
            cls = '',
            dataLevel;
    
        $('tbody tr', $table).each(function(ind) {
            $tr = $(this);
            cls = $tr.attr('class') || '';
            dataLevel = $tr.attr('data-level') || '';
            $trLeft = $('<tr class="'+cls+'" data-level="'+dataLevel+'"></tr>'); 
            $trRight = $('<tr class="'+cls+'" data-level="'+dataLevel+'"></tr>');
            
            $('td', $tr).each(function(tdi, $td) {
                if(tdi < options.fixedCols) {
                    $trLeft.append($td);
                } else {
                    $trRight.append($td);
                }
            });
            $trLeft.find('td').addClass('fixed-td');
            
            $divCols.append($trLeft);
            $divTable.append($trRight);
        });
        
        // 0 fixedCols fix: set first th and td in the matrix to 1px so that the right part will expand to fit the screen
        if(options.fixedCols == 0) {
            $topRow.find('th:first').width('1px');
            $bottomRow.find('td:first').width('1px');
            if(footer) {
                $footerRow.find('td:first').width('1px');
            }
        }
        
        return $topRow.add($bottomRow).add($footerRow);
    };
    
    var methods = {
        setWidths   :   setWidths
    };
    
    $.fn.tableScroll = function(o) {
        var args = Array.prototype.slice.call(arguments, 0);
        
        if (methods[o]) {
            return this.each(function() {
                methods[o].apply(this, args.slice(1));
            });
        } else {
            if (typeof o === 'object' || !o) {
                return this.each(function() {
                    init.apply(this, args);
                });
            } else {
                throw ('Method '+o+' doesn\'t exist in tableScroll');
            }
        }
        
        return this;
    };
    
    $.fn.tableScroll.defaults = {
        height          : 500,           // max height of scrolled table
        scrollDiff      : 14,            // standard scroll bar width
        standardHeight  : 500,           // max height is computed based on standard height
        fixedCols       : 0,             // number of fixed columns (left to right)
        classes         : '',            // classes to be added to final table
        sortable        : false,         // columns are sortable or not (false by default)
        tooltip         : true,          // tooltip for header cells
        gravity         : 's'            // tooltip orientation (s - displayed at the top)
    };
    
})(jQuery);


