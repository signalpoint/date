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
  try {
    var html = theme('select', variables);
    return html;
    // For each grain of the granulatiry, add a select list for each.
    $.each(variables.field_info_field.settings.granularity, function(grain, value){
        if (value) {
          // Build a unique html element id for this select list. Set up an
          // onclick handler and send it the id of the hidden input that will
          // hold the date value.
          var id = variables.attributes.id + '-' + grain;
          var attributes = {
            'id':id,
            'onchange':"date_select_onchange(this, '" + variables.attributes.id + "')"
          };
          switch (grain) {
            case 'year':
              // Determine the current year and the range of year(s) to provide
              // as options.
              var date = new Date();
              var year = parseInt(date.getFullYear());
              var year_range = variables.field_info_instance.widget.settings.year_range;
              var parts = year_range.split(':');
              var low = parseInt(parts[0]);
              var high = parseInt(parts[1].replace('+', ''));
              // Build the options.
              var options = {};
              for (var i = low; i <= high; i++) {
                var option = year + i;
                options[option] = '' + option;
              }
              // Build and theme the select list.
              var select = {'attributes':attributes, 'options':options};
              
              html += theme('select', select);
              break;
            default:
              console.log('WARNING: theme_date_select() - unsupported grain! (' + grain + ')');
              break;
          }
        }
    });
    return html;  
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Handles the onchange event for date select lists. It is given a reference
 * to the select list, the id of the hidden date field, and the grain of the
 * input.
 */
function date_select_onchange(input, id, grain) {
  try {
    var date = null;
    var current_val = $('#' + id).val();
    if (!current_val) { date = new Date(); }
    else { date = new Date(current_val); }
    switch (grain) {
      case 'year':
        date.setYear($(input).val());
        break;
      case 'month':
        date.setMonth($(input).val()-1);
        break;
      case 'day':
        date.setDate($(input).val());
        break;
    }
    $('#' + id).val(date_yyyy_mm_dd_hh_mm_ss(date_yyyy_mm_dd_hh_mm_ss_parts(date)));
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_field_widget_form().
 */
function date_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {
    // Convert the item into a hidden field that will have its value populated
    // dynamically be the widget.
    items[delta].type = 'hidden';
    
    // Determine if a value is set for this item.
    var value_set = true;
    if (typeof items[delta].value === 'undefined' || items[delta].value == '') {
      value_set = false;
    }
    
    // If the value isn't set, check if a default value is available.
    if (!value_set && items[delta].default_value == '' && instance.settings.default_value != '') {
      items[delta].default_value = instance.settings.default_value;
    }
    
    // If the value isn't set and we have a default value, let's set it.
    if (!value_set && items[delta].default_value != '') {
      switch (items[delta].default_value) {
        case 'now':
          var now = date_yyyy_mm_dd_hh_mm_ss();
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
    
    // Grab the current date.
    var date = new Date();
    
    // For each grain of the granulatiry, add a child for each.
    $.each(field.settings.granularity, function(grain, value){
        if (value) {
          // Build a unique html element id for this select list. Set up an
          // onclick handler and send it the id of the hidden input that will
          // hold the date value.
          var id = items[delta].id + '-' + grain;
          var attributes = {
            'id':id,
            'onchange':"date_select_onchange(this, '" + items[delta].id + "', '" + grain + "')"
          };
          switch (grain) {
            case 'year':
              // Determine the current year and the range of year(s) to provide
              // as options.          
              var year = parseInt(date.getFullYear());
              var year_range = instance.widget.settings.year_range;
              var parts = year_range.split(':');
              var low = parseInt(parts[0]);
              var high = parseInt(parts[1].replace('+', ''));
              if (!high) {
                var smoke_one = true;
                high = year;
              }
              // Build the options.
              var options = {};
              for (var i = low; i <= high; i++) {
                var option = i;
                options[option] = '' + option;
              }
              // Parse the year from the item's value.
              var item_date = new Date(items[delta].value);
              var year = parseInt(item_date.getFullYear());
              // Build and theme the select list.
              var select = {
                title: 'Year',
                type: 'date_select',
                value: year,
                attributes: attributes,
                options: options
              };
              items[delta].children.push(select);
              break;
            case 'month':
              // Determine the current month.          
              var month = parseInt(date.getMonth()) + 1;
              // Build the options.
              var options = {};
              for (var i = 1; i <= 12; i++) {
                options[i] = '' + i;
              }
              // Build and theme the select list.
              var select = {
                title: 'Month',
                type: 'date_select',
                value: month,
                attributes: attributes,
                options: options
              };
              items[delta].children.push(select);
              break;
            case 'day':
              // Determine the current month.          
              var day = parseInt(date.getDate());
              // Build the options.
              var options = {};
              for (var i = 1; i <= 31; i++) {
                options[i] = '' + i;
              }
              // Build and theme the select list.
              var select = {
                title: 'Day',
                type: 'date_select',
                value: day,
                attributes: attributes,
                options: options
              };
              items[delta].children.push(select);
              break;
            default:
              console.log('WARNING: date_field_widget_form() - unsupported grain! (' + grain + ')');
              break;
          }
        }
    });
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_assemble_form_state_into_field().
 */
function date_assemble_form_state_into_field(entity_type, bundle,
  form_state_value, field, instance, langcode, delta) {
  try {
    var date = new Date(form_state_value);
    var result = {};
    $.each(field.settings.granularity, function(grain, value){
        if (value) {
          switch (grain) {
          case 'year':
            result.year = date.getFullYear();
            break;
          case 'month':
            result.month = parseInt(date.getMonth()) + 1;
            //result.month = '' + (parseInt(date.getMonth()) + 1);
            //if (result.month.length == 1) { result.month = '0' + result.month; }
            break;
          case 'day':
            result.day = parseInt(date.getDate());
            //result.day = '' + date.getDate();
            //if (result.day.length == 1) { result.day = '0' + result.day; }
            break;
          }
        }
    });
    return result;
  }
  catch (error) {
    console.log('date_assemble_form_state_into_field - ' + error);
  }
}

