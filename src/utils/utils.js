import React from 'react';
import { Form, FormGroup, FormLabel, FormControl } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export function FieldGroup({ id, icon, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <FormLabel><FontAwesomeIcon icon={icon} /> {label}</FormLabel>
      <FormControl {...props} />
      {help && <Form.Text className="text-muted">{help}</Form.Text>}
    </FormGroup>
  );
}
