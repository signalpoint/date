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
      console.log('WARNING: theme_datetime() - unsupported widget type! (' + widget_type + ')');
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

/*function date_form_element_alter(form, element, variables) {
  if (element.type != 'datetime') { return; }
  //dpm(form);
  //dpm(element);
  dpm(variables);
  
  // Extract the field name.
  var field_name = element.name;
  
}*/

/**
 * Handles the onchange event for date select lists. It is given a reference
 * to the select list and the id of the hidden date field.
 */
function date_select_onchange(input, id) {
  try {
    // Grab the value, convert it to a unix timestamp, then set the hidden input
    // value with it.
    var year = $(input).val();
    var parts = date_yyyy_mm_dd_hh_mm_ss_parts();
    parts['year'] = year;
    $('#' + id).val(date_yyyy_mm_dd_hh_mm_ss(parts));
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
      if (items[delta].default_value == 'now') {
        var now = date_yyyy_mm_dd_hh_mm_ss();
        items[delta].value = now;
        items[delta].default_value = now;
      }
      else {
        console.log('WARNING: date_field_widget_form() - unsupported default value: ' + items[delta].default_value);
      }
    }
    
    // For each grain of the granulatiry, add a child for each.
    $.each(field.settings.granularity, function(grain, value){
        if (value) {
          // Build a unique html element id for this select list. Set up an
          // onclick handler and send it the id of the hidden input that will
          // hold the date value.
          var id = items[delta].id + '-' + grain;
          var attributes = {
            'id':id,
            'onchange':"date_select_onchange(this, '" + items[delta].id + "')"
          };
          switch (grain) {
            case 'year':
              // Determine the current year and the range of year(s) to provide
              // as options.
              var date = new Date();
              var year = parseInt(date.getFullYear());
              var year_range = instance.widget.settings.year_range;
              var parts = year_range.split(':');
              var low = parseInt(parts[0]);
              var high = parseInt(parts[1].replace('+', ''));
              // Build the options.
              var options = {};
              for (var i = low; i <= high; i++) {
                var option = year + i;
                options[option] = '' + option;
              }
              // Parse the year from the item's value.
              var date = new Date(items[delta].value);
              var year = parseInt(date.getFullYear());
              // Build and theme the select list.
              var select = {
                type:'date_select',
                value:year,
                'attributes':attributes,
                'options':options
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
 * Implements hook_field_data_string().
 */
function date_field_data_string(entity_type, bundle, entity, instance, langcode, delta, options) {
  try {
    var data = '';
    var date = new Date(entity[instance.field_name][langcode][delta]['value']);
    data += entity_type + '[' + instance.field_name + '][' + langcode + '][' + delta + '][value][year]=' + parseInt(date.getFullYear()); 
    return data;
  }
  catch (error) { drupalgap_error(error); }
}

