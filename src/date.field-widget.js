/**
 * Implements hook_field_widget_form().
 */
function date_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {

    //console.log(form);
    //console.log(form_state);
    console.log(field);
    console.log(instance);
    //console.log(langcode);
    console.log(items);
    //console.log(delta);
    console.log(element);

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
    if (!value_set && (items[delta].default_value == '' || !items[delta].default_value) && instance.settings.default_value != '') {
      items[delta].default_value = instance.settings.default_value;
    }
    if (!value2_set && (items[delta].default_value2 == '' || !items[delta].default_value2) && instance.settings.default_value2 != '') {
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
        case 'now':
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

    // Grab the current date.
    var date = new Date();

    // Grab the item date, if it is set.
    //var item_date = null;
    //var item_date2 = null;
    //if (value_set) { item_date = new Date(items[delta].value); }
    //if (value2_set) { item_date2 = new Date(items[delta].value2); }

    // Depending if we are collecting an end date or not, build a widget for each date value.
    var values = ['value'];
    if (!empty(todate)) { values.push('value2'); }
    $.each(values, function(_index, _value) {

      // Get the item date and offset, if any.
      var date_and_offset = _date_get_item_and_offset(items, delta, _value, value_set, value2_set);
      var item_date = date_and_offset.item_date;
      var offset = date_and_offset.offset;

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
      $.each(field.settings.granularity, function(grain, value) {
        if (value) {

          // Build a unique html element id for this select list. Set up an
          // onclick handler and send it the id of the hidden input that will
          // hold the date value.
          var id = items[delta].id;
          if (_value == 'value2') { id += '2'; } // "To date"
          id += '-' + grain;
          var attributes = {
            id: id,
            onchange: "date_select_onchange(this, '" + items[delta].id + "', '" + grain + "', " + military + ", " + increment + ", " + offset + ")"
          };
          switch (grain) {

            // YEAR
            case 'year':
              _widget_year = _date_grain_widget_year(date, instance, attributes, value_set, value2_set, item_date);
              break;

            // MONTH
            case 'month':
              _widget_month = _date_grain_widget_month(date, instance, attributes, value_set, value2_set, item_date);
              break;

            // DAY
            case 'day':
              _widget_day = _date_grain_widget_day(date, instance, attributes, value_set, value2_set, item_date);
              break;

            // HOUR
            case 'hour':
              _widget_hour = _date_grain_widget_hour(date, instance, attributes, value_set, value2_set, item_date, military);

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
              _widget_minute = _date_grain_widget_minute(date, instance, attributes, value_set, value2_set, item_date, _value, increment);
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

      // Wrap the widget with some better UX.
      _date_grain_widgets_ux_wrap(
          items,
          delta,
          _widget_year,
          _widget_month,
          _widget_day,
          _widget_hour,
          _widget_minute,
          _widget_second,
          _widget_ampm
      );

    });

    // If the field base is configured for the "date's timezone handling", add a timezone picker to the widget.
    if (date_tz_handling_is_date(field)) {
      var tz_options = {};
      $.each(drupalgap.time_zones, function(i, tz) { tz_options[tz] = tz; });
      var _widget_tz_handling = {
        type: 'select',
        options: tz_options,
        title: t('Timezone'),
        attributes: {
          id: items[delta].id + '-timezone'
        }
      };
      if (value_set && items[delta].item.timezone) { // Set timezone for existing value.
        _widget_tz_handling.value = items[delta].item.timezone;
      }
      else if (!value_set && field.settings.timezone_db) { // Set timezone for new value.
        _widget_tz_handling.value = field.settings.timezone_db;
      }
      items[delta].children.push(_widget_tz_handling);
    }

  }
  catch (error) {
    console.log('date_field_widget_form - ' + error);
  }
}

/**
 * Given a date field base, this will return true if its time zone handling is set to date.
 * @param field
 * @returns {*|boolean}
 */
function date_tz_handling_is_date(field) {
  return field.settings.tz_handling && field.settings.tz_handling == 'date' && drupalgap.time_zones;
}
