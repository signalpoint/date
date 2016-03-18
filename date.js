/**
 *
 */
function theme_datetime(variables) {
  try {
    //dpm(variables);
    var html = '';
    
    // Make this a hidden field since the widget will just populate a value.
    variables.attributes.type = 'hidden';
    html += '<input ' + drupalgap_attributes(variables.attributes) + '/>';
    
    // Render the widget based on its type.
    var widget_type = variables.field_info_instance.widget.type;
    var widget_function = 'theme_' + widget_type; 
    if (drupalgap_function_exists(widget_function)) {
      var fn = window[widget_function];
      html += fn.call(null, variables);
    }
    else {
      console.log('WARNING: theme_datetime() - unsupported widget type! (' +
          widget_type +
        ')'
      );
    }
    
    return html;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 *
 */
function theme_date_select(variables) {
  try { return theme('select', variables); }
  catch (error) { drupalgap_error(error); }
}

/**
 *
 * @param value
 * @returns {Date}
 */
function date_prepare(value) {
  try {
    // @see http://stackoverflow.com/a/16664730/763010
    return new Date(Date.parse(value.replace(/-/g,'/')));
  }
  catch (error) {
    console.log('date_prepare() - ' + error);
  }
}

/**
 * Given a field instance this will return true if it is configured for a 24 hour format, false otherwise.
 * @param instance
 * @returns {boolean}
 */
function date_military(instance) {
  // We know we have a 12 hour format if the date input format string contains a 'g' or an 'h'.
  // @see http://php.net/manual/en/function.date.php
  var military = true;
  if (instance.widget.settings.input_format && (
          instance.widget.settings.input_format.indexOf('g') != -1 ||
          instance.widget.settings.input_format.indexOf('h') != -1
      )) { military = false; }
  return military;
}

/**
 * Handles the onchange event for date select lists. It is given a reference
 * to the select list, the id of the hidden date field, and the grain of the
 * input.
 */
function date_select_onchange(input, id, grain, military, increment) {
  try {
    
    // Are we setting a "to date"?
    var todate = $(input).attr('id').indexOf('value2') != -1 ? true : false;
    
    // Grab the current value (which may include both the "from" and "to" dates
    // separated by a pipe '|')
    var current_val = $('#' + id).val();

    // Is there a "to date" already set on the current value?
    var todate_already_set = current_val.indexOf('|') != -1 ? true : false;
    
    // Prepare the value part(s).
    var parts = [];
    if (todate_already_set) { parts = current_val.split('|'); }
    else { parts.push(current_val); }
    
    // Get the date for the current value, or just default to now.
    var date = null;
    if (!current_val) { date = new Date(); }
    else {

      // In case they set the "to date" before the "from date", give the "from date" a default value.
      if (!todate && empty(parts[0])) { parts[0] = date_yyyy_mm_dd_hh_mm_ss(); }

      //Fixes iOS bug spaces must be replaced with T's
      if (typeof device !== 'undefined' && device.platform == 'iOS') {

        if (!todate) { parts[0] = parts[0].replace(' ', 'T'); }
        else {
          if (todate_already_set) { parts[1] = parts[1].replace(' ', 'T'); }
        }
      }

      if (!todate) { date = new Date(parts[0]); }
      else {
        if (todate_already_set) { date = new Date(parts[1]); }
        else { date = new Date(); }
      }

    }

    var input_val = $(input).val();
    switch (grain) {
      case 'year':
        date.setYear(input_val);
        break;
      case 'month':
        date.setMonth(input_val - 1);
        break;
      case 'day':
        date.setDate(input_val);
        break;
      case 'hour':
        if (!military) {
          input_val = parseInt(input_val);
          var ampm_input = $('#' + $(input).attr('id').replace(grain, 'ampm'));
          var ampm_input_value = $(ampm_input).val();
          switch (ampm_input_value) {
            case 'am':
              if (input_val == 12) { input_val = 0; }
              date.setHours(input_val);
              break;
            case 'pm':
              if (input_val == 12) { input_val = 0; }
              date.setHours(input_val + 12);
              break;
          }
        }
        else { date.setHours(input_val); }
        break;
      case 'minute':
        date.setMinutes(input_val);
        break;
      case 'ampm':
        if (input_val == 'pm') {
          if (date.getHours() < 12) { date.setHours(date.getHours() + 12); }
          else { date.setHours(date.getHours()); }
        }
        else if (input_val == 'am') { date.setHours(date.getHours() - 12); }
        break;
    }

    // Adjust the minutes.
    date.setMinutes(_date_minute_increment_adjust(increment, date.getMinutes()));

    // Finally set the value.
    var _value = date_yyyy_mm_dd_hh_mm_ss(date_yyyy_mm_dd_hh_mm_ss_parts(date));
    if (!todate) { parts[0] = _value; }
    else { parts[1] = _value;  }
    $('#' + id).val(parts.join('|'));
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_field_formatter_view().
 */
function date_field_formatter_view(entity_type, entity, field, instance, langcode, items, display) {
  try {

    //console.log(field);
    //console.log(instance);
    //console.log(display);
    //console.log(items);
    //console.log('date_formats');
    //console.log(drupalgap.date_formats);
    //console.log('date_types');
    //console.log(drupalgap.date_types);
    var element = {};

    // What type of display are we working with?
    // Manage Display - Format
    //   date_default = Date and time
    //   format_interval = Time ago
    var type = display.type;

    if (type == 'date_default') {

      var format = null;

      if (drupalgap.date_formats[display.settings.format_type]) {
        // Since we're unable to locate the format to use within the field or the
        // instance, we'll just use the first format type in the collection.
        var format_type = drupalgap.date_formats[display.settings.format_type];
        $.each(format_type, function(index, object) {
            format_type = object;
            return false;
        });
        format = format_type.format;
      }
      else {
        // This is (probably) a custom date format, grab the format that
        // the drupalgap.module has bundled within the date_types.
        format = drupalgap.date_types[display.settings.format_type].format;
      }

      // Now iterate over the items and render them using the format.
      $.each(items, function(delta, item) {
          var value2_present = typeof item.value2 !== 'undefined' ? true: false;
          var label = value2_present ? 'From: ' : '';
          var d = date_prepare(item.value);
          element[delta] = {
            markup: '<div class="value">' + label + date(format, d.getTime()) + '</div>'
          };
          if (value2_present) {
            var d2 = date_prepare(item.value2);
            element[delta].markup += '<div class="value2">To: ' + date(format, d2.getTime()) + '</div>';
          }
      });

    }
    else if (type == 'format_interval') {
      var interval = display.settings.interval;
      var interval_display = display.settings.interval_display;
      var now = new Date();
      $.each(items, function(delta, item) {
          var d = date_prepare(item.value);
          if (interval_display == 'time ago' || interval_display == 'raw time ago') {
            var markup = drupalgap_format_interval(
              (now.getTime() - d.getTime()) / 1000,
              interval
            );
            if (interval_display == 'time ago') { markup += ' ago'; }
            element[delta] = { markup: markup };
          }
          else {
            console.log('WARNING: date_field_formatter_view - unsupported interval_display (' + interval_display + ')');
          }
      });
    }
    else {
      console.log('WARNING: date_field_formatter_view - unsupported type (' + type + ')');
    }
    return element;
  }
  catch (error) { console.log('date_field_formatter_view - ' + error); }
}

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

    // Convert the item into a hidden field that will have its value populated
    // dynamically by the widget.
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

    // Are we doing a 12 or 24 hour format? We'll assume military 24 hour by default, unless we prove otherwise.
    var military = date_military(instance);
    
    // For each grain of the granulatiry, add a child for each. As we build the
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
                prefix: theme('date_label', { title: 'Year' }),
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
                prefix: theme('date_label', { title: 'Month' }),
                type: 'date_select',
                value: month,
                attributes: attributes,
                options: options
              };
              break;

            // DAY
            case 'day':
              // Determine the current month.          
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
                prefix: theme('date_label', { title: 'Day' }),
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
              if (value_set) { hour = parseInt(item_date.getHours()); }

              // Build and theme the select list.
              _widget_hour = {
                prefix: theme('date_label', { title: 'Hour' }),
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
                prefix: theme('date_label', { title: 'Minute' }),
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
      var text = _value != 'value2' ? 'From' : 'To'; 
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

/**
 * Implements hook_assemble_form_state_into_field().
 */
function date_assemble_form_state_into_field(entity_type, bundle,
  form_state_value, field, instance, langcode, delta, field_key) {
  try {
    
    field_key.use_delta = false;

    // Grab our "to date" setting for the field.
    var todate = field.settings.todate;

    // On iOS we must place a 'T' on the date.
    if (typeof device !== 'undefined' && device.platform == 'iOS') {
      form_state_value = form_state_value.replace(/ /g, 'T');
    }
    var result = {};
    
    var values = ['value'];
    if (!empty(todate)) { values.push('value2'); }
    $.each(values, function(_index, _value) {
        
        result[_value] = {};
        
        // Is there a "to date" already set on the current value?
        var todate_already_set = form_state_value.indexOf('|') != -1 ? true : false;
        
        // Perpare the value part(s).
        var parts = [];
        if (todate_already_set) { parts = form_state_value.split('|'); }
        else { parts.push(form_state_value); }
        
    $.each(field.settings.granularity, function(grain, value) {
        
        var date = null;
        if (_value == 'value') { date = new Date(parts[0]); }
        else if (_value == 'value2') {  date = new Date(parts[1]); }
        
        if (value) {
          switch (grain) {
          case 'year':
            result[_value].year = date.getFullYear();
            break;
          case 'month':
            result[_value].month = parseInt(date.getMonth()) + 1;
            break;
          case 'day':
            result[_value].day = parseInt(date.getDate());
            break;
          case 'hour':
            result[_value].hour = parseInt(date.getHours());
            break;
          case 'minute':
            result[_value].minute = '' + parseInt(date.getMinutes());
            if (result[_value].minute.length == 1) { result[_value].minute = '0' + result[_value].minute; }
            break;
          }
        }
    });        

    });

    return result;
  }
  catch (error) {
    console.log('date_assemble_form_state_into_field - ' + error);
  }
}

/**
 *
 */
function _date_minute_increment_adjust(increment, minute) {
  try {
    switch (increment) {
      case 5:
        if (minute < 5) { minute = 0; }
        else if (minute < 10) { minute = 5; }
        else if (minute < 15) { minute = 10; }
        else if (minute < 20) { minute = 15; }
        else if (minute < 25) { minute = 20; }
        else if (minute < 30) { minute = 25; }
        else if (minute < 35) { minute = 30; }
        else if (minute < 40) { minute = 35; }
        else if (minute < 45) { minute = 40; }
        else if (minute < 50) { minute = 45; }
        else if (minute < 55) { minute = 50; }
        else if (minute < 60) { minute = 55; }
        break;
      case 10:
        if (minute < 10) { minute = 0; }
        else if (minute < 20) { minute = 10; }
        else if (minute < 30) { minute = 20; }
        else if (minute < 40) { minute = 30; }
        else if (minute < 50) { minute = 40; }
        else if (minute < 60) { minute = 50; }
        break;
      case 15:
        if (minute < 15) { minute = 0; }
        else if (minute < 30) { minute = 15; }
        else if (minute < 45) { minute = 30; }
        else if (minute < 60) { minute = 45; }
        break;
      case 30:
        if (minute < 30) { minute = 0; }
        else if (minute < 60) { minute = 30; }
        break;
    }
    return minute;
  }
  catch (error) { console.log('_date_minute_increment_adjust - ' + error); }
}

/**
 *
 */
function theme_date_label(variables) {
  try {
    return '<div ' + drupalgap_attributes(variables.attributes) + '><strong>' +
      variables.title +
    '</strong></div>';
  }
  catch (error) { console.log('theme_date_label - ' + error); }
}
