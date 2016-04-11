/**
 * Implements hook_field_widget_form().
 */
function date_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {

    //console.log(form);
    //console.log(form_state);
    //console.log(field);
    //console.log(instance);
    //console.log(langcode);
    //console.log(items);
    //console.log(delta);
    //console.log(element);

    // Convert the item into a hidden field that will have its value populated dynamically by the widget. We'll store
    // the value (and potential value2) within the element using this format: YYYY-MM-DD HH:MM:SS|YYYY-MM-DD HH:MM:SS
    items[delta].type = 'hidden';

    // Determine if the "to date" is disabled, optional or required.
    var todate = field.settings.todate; // '', 'optional', 'required'

    // Grab the minute increment.
    var increment = parseInt(instance.widget.settings.increment);
    var d = new Date();
    d.setMinutes(_date_minute_increment_adjust(increment, d.getMinutes()));

    // Determine if values have been set for this item.
    var value_set = true;
    var value2_set = true;
    if (typeof items[delta].value === 'undefined' || items[delta].value == '') {
      value_set = false;
    }
    if (
        typeof items[delta].item === 'undefined' ||
        typeof items[delta].item.value2 === 'undefined' ||
        items[delta].item.value2 == ''
    ) { value2_set = false; }

    // If the value isn't set, check if a default value is available.
    if (!value_set && items[delta].default_value == '' && instance.settings.default_value != '') {
      items[delta].default_value = instance.settings.default_value;
    }
    if (!value2_set) {
      items[delta].default_value2 = instance.settings.default_value2;
    }

    // If the value isn't set and we have a default value, let's set it.
    if (!value_set && items[delta].default_value != '') {
      switch (items[delta].default_value) {
        case 'now':
          var now = date_yyyy_mm_dd_hh_mm_ss(date_yyyy_mm_dd_hh_mm_ss_parts(d));
          items[delta].value = now;
          items[delta].default_value = now;
          break;
        case 'blank':
          items[delta].value = '';
          items[delta].default_value = '';
          break;
        default:
          console.log('WARNING: date_field_widget_form() - unsupported default value: ' + items[delta].default_value);
          break;
      }
    }
    if (!value2_set && items[delta].default_value2 != '') {
      switch (items[delta].default_value2) {
        case 'same':
          var now = date_yyyy_mm_dd_hh_mm_ss(date_yyyy_mm_dd_hh_mm_ss_parts(d));
          items[delta].value2 = now;
          items[delta].default_value2 = now;
          if (!empty(items[delta].value)) { items[delta].value += '|'; }
          items[delta].value += items[delta].value2;
          if (!empty(items[delta].default_value)) { items[delta].default_value += '|'; }
          items[delta].default_value += items[delta].default_value2;
          break;
        case 'blank':
          items[delta].value2 = '';
          items[delta].default_value2 = '';
          break;
        default:
          console.log('WARNING: date_field_widget_form() - unsupported default value 2: ' + items[delta].default_value2);
          break;
      }
    }

    // If we have a value2, append it to our hidden input's value and default value. We need to set the value attribute
    // on this item, otherwise the DG FAPI will default it to the item's value, which is only the first part of the
    // date.
    if (value2_set && items[delta].value.indexOf('|') == -1) {
      items[delta].value += '|' + items[delta].item.value2;
      if (!items[delta].attributes) { items[delta].attributes = {}; }
      items[delta].attributes.value = items[delta].value;
    }
    if ((value_set || value2_set) && empty(items[delta].default_value) && !empty(items[delta].value)) {
      items[delta].default_value = items[delta].value;
    }

    // Grab the current date.
    var date = new Date();

    // Grab the item date, if it is set.
    //var item_date = null;
    //var item_date2 = null;
    //if (value_set) { item_date = new Date(items[delta].value); }
    //if (value2_set) { item_date2 = new Date(items[delta].value2); }

    // Depending on if we are collecting an end date or not, build a widget for
    // each date value.
    var values = ['value'];
    if (!empty(todate)) { values.push('value2'); }
    $.each(values, function(_index, _value) {

      // Grab the item date, if it is set.
      var item_date = null;
      if (value_set && _value == 'value') {
        if (items[delta].value.indexOf('|') != -1) {
          var parts = items[delta].value.split('|');
          item_date = new Date(parts[0]);
        }
        else { item_date = new Date(items[delta].value); }
      }
      if (value2_set && _value == 'value2') { item_date = new Date(items[delta].item.value2); }

      // Are we doing a 12 or 24 hour format?
      var military = date_military(instance);

      // For each grain of the granularity, add a child for each. As we build the
      // children widgets we'll set them aside one by one that way we can present
      // the inputs in a desirable order.
      var _widget_year = null;
      var _widget_month = null;
      var _widget_day = null;
      var _widget_hour = null;
      var _widget_minute = null;
      var _widget_second = null;
      var _widget_ampm = null;
      $.each(field.settings.granularity, function(grain, value){
        if (value) {

          // Build a unique html element id for this select list. Set up an
          // onclick handler and send it the id of the hidden input that will
          // hold the date value.
          var id = items[delta].id;
          if (_value == 'value2') { id += '2'; } // "To date"
          id += '-' + grain;
          var attributes = {
            id: id,
            onchange: "date_select_onchange(this, '" + items[delta].id + "', '" + grain + "', " + military + ", " + increment + ")"
          };
          switch (grain) {

            // YEAR
            case 'year':
              // Determine the current year and the range of year(s) to provide
              // as options. The range can either be relative, absolute or both,
              // e.g. -3:+3, 2000:2010, 2000:+3
              var year = parseInt(date.getFullYear());
              var year_range = instance.widget.settings.year_range;
              var parts = year_range.split(':');
              // Determine the low end year integer value.
              var low = parts[0];
              var low_absolute = true;
              if (low.indexOf('-') != -1 || low.indexOf('+') != -1) { low_absolute = false; }
              if (!low_absolute) {
                if (low.indexOf('+') != -1) {
                  low = low.replace('+', '');
                }
                low = parseInt(low) + year;
              }
              else { low = parseInt(low); }
              if (!low) { low = year; }
              // Determine the high end year integer value.
              var high = parts[1];
              var high_absolute = true;
              if (high.indexOf('-') != -1 || high.indexOf('+') != -1) { high_absolute = false; }
              if (!high_absolute) {
                if (high.indexOf('+') != -1) {
                  high = high.replace('+', '');
                }
                high = parseInt(high) + year;
              }
              else { high = parseInt(high); }
              if (!high) { high = year; }
              // Build the options.
              var options = {};
              for (var i = low; i <= high; i++) {
                options[i] = i;
              }
              // Parse the year from the item's value, if it is set.
              if (value_set) { year = parseInt(item_date.getFullYear()); }
              // Build and theme the select list.
              _widget_year = {
                prefix: theme('date_label', { title: t('Year') }),
                type: 'date_select',
                value: year,
                attributes: attributes,
                options: options
              };

              break;

            // MONTH
            case 'month':
              // Determine the current month.
              var month = parseInt(date.getMonth()) + 1;
              // Build the options.
              var options = {};
              for (var i = 1; i <= 12; i++) {
                options[i] = '' + i;
              }
              // Parse the month from the item's value, if it is set.
              if (value_set) { month = parseInt(item_date.getMonth()) + 1; }
              // Build and theme the select list.
              _widget_month = {
                prefix: theme('date_label', { title: t('Month') }),
                type: 'date_select',
                value: month,
                attributes: attributes,
                options: options
              };
              break;

            // DAY
            case 'day':
              // Determine the current day.
              var day = parseInt(date.getDate());
              // Build the options.
              var options = {};
              for (var i = 1; i <= 31; i++) {
                options[i] = '' + i;
              }
              // Parse the day from the item's value, if it is set.
              if (value_set) { day = parseInt(item_date.getDate()); }
              // Build and theme the select list.
              _widget_day = {
                prefix: theme('date_label', { title: t('Day') }),
                type: 'date_select',
                value: day,
                attributes: attributes,
                options: options
              };

              break;

            // HOUR
            case 'hour':

              // Determine the current hour.
              var hour = parseInt(date.getHours());

              // Build the options, paying attention to 12 vs 24 hour format.
              var options = {};
              var max = military ? 23 : 12;
              var min = military ? 0 : 1;
              for (var i = min; i <= max; i++) { options[i] = '' + i; }

              // Parse the hour from the item's value, if it is set.
              if (value_set) {
                hour = parseInt(item_date.getHours());
                if (!military) {
                  if (hour > 12) { hour -= 12; }
                  else if (hour === 0) { hour = 12; }
                }
              }

              // Build and theme the select list.
              _widget_hour = {
                prefix: theme('date_label', { title: t('Hour') }),
                type: 'date_select',
                value: hour,
                attributes: attributes,
                options: options
              };

              // Add an am/pm selector if we're not in military time.
              if (!military) {
                _widget_ampm = {
                  type: 'select',
                  attributes: {
                    id: attributes.id.replace(grain, 'ampm'),
                    onclick: attributes.onchange.replace(grain, 'ampm')
                  },
                  value: parseInt(item_date.getHours()) < 12 ? 'am' : 'pm',
                  options: {
                    am: 'am',
                    pm: 'pm'
                  }
                };
              }

              break;

            // MINUTE
            case 'minute':

              // Determine the current minute.
              var minute = parseInt(date.getMinutes());

              // Build the options.
              var options = {};
              for (var i = 0; i <= 59; i += increment) {
                var text = '' + i;
                if (text.length == 1) { text = '0' + text; }
                options[i] = text;
              }

              // Parse the minute from the item's value, if it is set.
              if (value_set && _value == 'value') { minute = parseInt(item_date.getMinutes()); }
              else if (value2_set && _value == 'value2') { minute = parseInt(item_date.getMinutes()); }
              if (increment != 1) {
                minute = _date_minute_increment_adjust(increment, minute);
              }

              // Build and theme the select list.
              _widget_minute = {
                prefix: theme('date_label', { title: t('Minute') }),
                type: 'date_select',
                value: minute,
                attributes: attributes,
                options: options
              };

              break;

            default:
              console.log('WARNING: date_field_widget_form() - unsupported grain! (' + grain + ')');
              break;
          }
        }
      });

      // Show the "from" or "to" label?
      if (!empty(todate)) {
        var text = _value != 'value2' ? t('From') : t('To');
        items[delta].children.push({ markup: theme('header', { text: text + ': ' }) });
      }

      // Add the children widgets in the order of "y-m-d h-i-s", and wrap them in
      // jQM grids as necessary to help with UX...

      // YMD
      var ymd_grid = null;
      if (_widget_month && !_widget_day) { ymd_grid = 'ui-grid-a'; }
      else if (_widget_month && _widget_day) { ymd_grid = 'ui-grid-b'; }
      if (ymd_grid) {
        items[delta].children.push({ markup: '<div class="' + ymd_grid + '">' });
      }
      if (_widget_year) {
        if (ymd_grid) {
          _widget_year.prefix = '<div class="ui-block-a">' + _widget_year.prefix;
          _widget_year.suffix = '</div>';
        }
        items[delta].children.push(_widget_year);
      }
      if (_widget_month) {
        if (ymd_grid) {
          _widget_month.prefix = '<div class="ui-block-b">' + _widget_month.prefix;
          _widget_month.suffix = '</div>';
        }
        items[delta].children.push(_widget_month);
      }
      if (_widget_day) {
        if (ymd_grid) {
          var _block_class = _widget_month ? 'ui-block-c' : 'ui-block-b';
          _widget_day.prefix = '<div class="' + _block_class + '">' + _widget_day.prefix;
          _widget_day.suffix = '</div>';
        }
        items[delta].children.push(_widget_day);
      }
      if (ymd_grid) { items[delta].children.push({ markup: '</div>' }); }

      // HIS
      var his_grid = null;
      if (_widget_hour) {
        if (_widget_minute && !_widget_second) { his_grid = 'ui-grid-a'; }
        else if (_widget_minute && _widget_second) { his_grid = 'ui-grid-b'; }
      }
      else {
        if (_widget_minute && _widget_second) { his_grid = 'ui-grid-b'; }
      }
      if (his_grid) {
        items[delta].children.push({ markup: '<div class="' + his_grid + '">' });
      }
      if (_widget_hour) {
        if (his_grid) {
          _widget_hour.prefix = '<div class="ui-block-a">' + _widget_hour.prefix;
          _widget_hour.suffix = '</div>';
        }
        items[delta].children.push(_widget_hour);
      }
      if (_widget_minute) {
        if (his_grid) {
          var _block_class = 'ui-block-a';
          if (_widget_hour) { _block_class = 'ui-block-b'; }
          _widget_minute.prefix = '<div class="' + _block_class + '">' + _widget_minute.prefix;
          _widget_minute.suffix = '</div>';
        }
        items[delta].children.push(_widget_minute);
      }
      if (_widget_second) { items[delta].children.push(_widget_second); }
      if (_widget_ampm) { items[delta].children.push(_widget_ampm); }
      if (ymd_grid) { items[delta].children.push({ markup: '</div>' }); }

    });

  }
  catch (error) {
    console.log('date_field_widget_form - ' + error);
  }
}
