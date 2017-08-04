import React from 'react';
import { FormGroup, ControlLabel, FormControl, HelpBlock, Glyphicon } from 'react-bootstrap';

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

export function FieldGroup({ id, glyph, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <ControlLabel><Glyphicon glyph={glyph} /> {label}</ControlLabel>
      <FormControl {...props} />
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
}
