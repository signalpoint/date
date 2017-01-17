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
    if (function_exists(widget_function)) {
      var fn = window[widget_function];
      html += fn.call(null, variables);
    }
    else {
      var msg = 'WARNING: theme_datetime() - unsupported widget type! (' + widget_type + ')';
      console.log(msg);
    }

    return html;
  }
  catch (error) { console.log('theme_datetime - ' + error); }
}

/**
 *
 */
function theme_date_select(variables) {
  try { return theme('select', variables); }
  catch (error) { console.log('theme_date_select - ' + error); }
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
