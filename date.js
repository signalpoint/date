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
    var html = '';
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
              // Theme the select list.
              html += theme('select', {'attributes':attributes, 'options':options});
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
    $('#' + id).val($(input).val());
  }
  catch (error) { drupalgap_error(error); }
}

