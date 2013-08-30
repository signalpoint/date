function theme_datetime(variables) {
  try {
    dpm(variables);
    var html = '';
    
    // Make this a hidden field since the widget will just populate a value.
    variables.attributes.type = 'hidden';
    
    html += '<input ' + drupalgap_attributes(variables.attributes) + '/>';
    
    console.log(html);
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
