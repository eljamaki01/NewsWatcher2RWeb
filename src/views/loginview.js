import React, { Component } from 'react';
import { Redirect } from 'react-router'
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, FormControl, HelpBlock, Checkbox, Button } from 'react-bootstrap';
import superagent from 'superagent';
import noCache from 'superagent-no-cache';
import '../App.css';

function FieldGroup({ id, label, help, ...props }) {
	return (
		<FormGroup controlId={id}>
			<ControlLabel>{label}</ControlLabel>
			<FormControl {...props} />
			{help && <HelpBlock>{help}</HelpBlock>}
		</FormGroup>
	);
}

class LoginView extends Component {
	constructor(props) {
		super(props);

		this.state = {
			email: "",
			password: "",
			remeberMe: false
		};
	}

	componentDidMount() {
	}

	handleSubmit = (event) => {
		event.preventDefault();
		superagent.post("/api/sessions")
			.send({
				email: this.state.email,
				password: this.state.password
			})
			.set('Content-Type', 'application/json')
			.use(noCache)
			.end((err, res) => {
				if (err || !res.ok || res.status != 201) {
					this.props.parentMsgCB({ type: "MSG_LOGIN_FAIL", msg: `Sign in failed: ${res.body.message}` });
				} else {
					this.props.parentMsgCB({ type: "MSG_LOGIN_OK", msg: `Signed in as ${res.body.displayName}`, data: res.body });
					// Set the token in client side storage if the user desires
					if (this.state.remeberMe) {
						var xfer = {
							token: res.body.token,
							displayName: res.body.displayName,
							userId: res.body.userId
						};
						window.localStorage.setItem("userToken", JSON.stringify(xfer));
					} else {
						window.localStorage.removeItem("userToken");
					}
					<Redirect to="/#/news" />

				}
			});
	}

	handleEmailChange = (event) => {
		this.setState({ email: event.target.value });
	}

	handlePasswordChange = (event) => {
		this.setState({ password: event.target.value });
	}

	handleCheckboxChange = (event) => {
		this.setState({ remeberMe: event.target.checked });
	}

	render() {
		return (
			<form onSubmit={this.handleSubmit}>
				<FieldGroup
					id="formControlsEmail"
					type="email"
					label="Email address"
					placeholder="Enter email"
					onChange={this.handleEmailChange}
				/>
				<FieldGroup
					id="formControlsPassword"
					label="Password"
					type="password"
					onChange={this.handlePasswordChange}
				/>
				<Checkbox checked onChange={this.handleCheckboxChange}>
					Keep me logged in
                </Checkbox>
				<Button bsStyle="success" bsSize="lg" block type="submit">
					Login
                </Button>
			</form>
			// <p>Not a NewsWatcher user? <a id="registerLink" href="javascript:void(0)" ng-click="openRegModal()">Sign Up</a></p>
		);
	}
}

LoginView.propTypes = {
	parentMsgCB: PropTypes.func.isRequired
};

export default LoginView;
