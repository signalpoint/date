/**
 * Implements hook_assemble_form_state_into_field().
 */
function date_assemble_form_state_into_field(entity_type, bundle, form_state_value, field, instance, langcode, delta, field_key) {
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
              if (!date_military(instance)) {
                if (result[_value].hour >= 12) {
                  result[_value].hour = result[_value].hour % 12;
                  result[_value].ampm = 'pm';
                }
              }
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
