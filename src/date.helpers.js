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
 * Given a field instance this will return true if it is configured for a 24 hour format, false otherwise.  We'll assume
 * military 24 hour by default, unless we prove otherwise.
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
 * Given a date format string and the granularity settings from the date's field info field, this will remove any
 * characters from the format that are not allowed in the granularity of the date.
 * @param format
 * @param granularity
 */
function date_format_cleanse(format, granularity) {
  for (grain in granularity) {
    if (!granularity.hasOwnProperty(grain)) { continue; }
    var item = granularity[grain];
    if (item) { continue; } // Skip any collected grains.
    var characters = []; // @see http://php.net/manual/en/function.date.php
    switch (grain) {
      case 'year':
        characters = ['L', 'o', 'Y', 'y'];
        break;
      case 'month':
        characters = ['F', 'm', 'M', 'n', 't'];
        break;
      case 'day':
        characters = ['d', 'D', 'j', 'l', 'L', 'N', 'S', 'w', 'z'];
        break;
      case 'hour':
        characters = [' - ', 'g:', 'G:', 'h:', 'H:', 'g', 'G', 'h', 'H'];
        break;
      case 'minute':
        characters = ['i:', 'i'];
        break;
      case 'second':
        characters = ['s'];
        break;
    }
    if (characters.length) {
      for (var i = 0; i < characters.length; i++) {
        var character = characters[i];
        format = format.replace(character, '');
      }
    }
  }
  return format;
}
