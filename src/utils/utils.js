import React from 'react';
import { Form, FormGroup, FormLabel, FormControl } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export function toHours(date) {
  var d1 = date;
  var d2 = Date.now();
  var diff = Math.floor((d2 - d1) / 3600000);
  if (diff === 0 || diff < 2) {
    return "1 hour ago";
  } else {
    return diff.toString() + " hours ago";
  }
}

export function FieldGroup({ id, icon, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <FormLabel><FontAwesomeIcon icon={icon} /> {label}</FormLabel>
      <FormControl {...props} />
      {help && <Form.Text className="text-muted">{help}</Form.Text>}
    </FormGroup>
  );
}
