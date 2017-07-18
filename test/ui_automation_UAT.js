//
// Run UI automation selenium tests from command prompt:
// node server.js
// .\node_modules\.bin\mocha --timeout 30000 test\ui_automation_UAT.js
//

var assert = require('assert');
var webdriver = require('selenium-webdriver');
//var request = require('supertest')('https://www.newswatcherfs.com/'); // To hit production AWS!
var request = require('supertest')('http://localhost:3000'); // For local testing

describe('NewsWatcher UI exercising', function () {
	var driver;
	var storyID;
	var token;
	
	
	// Runs before all tests in this block
	before(function (done) {
		driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).build();
		//driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
		//driver.get('https://www.newswatcherfs.com/');
		driver.get('http://localhost:3000');
		driver.wait(webdriver.until.elementLocated(webdriver.By.id('registerLink')), 10000).then(function (item) {
			done();
		});
	});
	
	// Runs after all tests in this block
	after(function (done) {
		driver.quit().then(done);
	});
	
	it('should deny a login with a non-registered email', function (done) {
		driver.findElement(webdriver.By.id('emailLogin')).sendKeys('Testperson@blah.com');
		driver.findElement(webdriver.By.id('passwordLogin')).sendKeys('abc123*');
		driver.findElement(webdriver.By.id('btnLogin')).click();
		driver.wait(webdriver.until.elementLocated(webdriver.By.id('currentMsgIndex')), 5000);
		// In this case, currentMsgIndex is not visible until text appears in it the first time
		driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
			assert.equal(value, '(Sign in failed. Error: User was not found.)');
			done();
		});
	});
	
	it('should create a new registered User', function (done) {
		driver.findElement(webdriver.By.id('registerLink')).click();
		// In this case, we need to wait for the modal to appear and the controls to be visible
		driver.wait(webdriver.until.elementIsVisible(driver.findElement(webdriver.By.id('btnRegister'))), 5000);
		driver.findElement(webdriver.By.id('displayNameRegister')).sendKeys('Testperson');
		driver.findElement(webdriver.By.id('emailRegister')).sendKeys('Testperson@blah.com');
		driver.findElement(webdriver.By.id('passwordRegister')).sendKeys('abc123*');
		driver.findElement(webdriver.By.id('btnRegister')).click();
		// Wait for the status message update
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Registered)');
				done();
			});
		}, 3000);
	});
	
	it('should allow registered user to login', function (done) {
		driver.findElement(webdriver.By.id('btnLogin')).click();
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(News fetched)');
				done();
			});
		}, 3000);
	});
	
	it('should allow a registered user to logout', function (done) {
		// In this case, we need to wait for the menu buttons to be visible
		driver.wait(webdriver.until.elementIsVisible(driver.findElement(webdriver.By.id('logoutLink'))), 5000);
		driver.findElement(webdriver.By.id('logoutLink')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Signed out)');
				done();
			});
		}, 3000);
	});
	
	it('should allow registered user to log back in', function (done) {
		driver.findElement(webdriver.By.id('emailLogin')).sendKeys('Testperson@blah.com');
		driver.findElement(webdriver.By.id('passwordLogin')).sendKeys('abc123*');
		driver.findElement(webdriver.By.id('btnLogin')).click();
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(News fetched)');
				done();
			});
		}, 3000);
	});
	
	it('should open the news filters user profile', function (done) {
		driver.findElement(webdriver.By.id('profileLink')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Profile fetched)');
				done();
			});
		}, 3000);
	});
	
	it('should delete and add to update a news filter', function (done) {
		driver.findElement(webdriver.By.id('btnDelete')).click();
		
		driver.findElement(webdriver.By.id('btnAdd')).click();
		driver.findElement(webdriver.By.id('nameTxt')).sendKeys(webdriver.Key.CONTROL + 'a');
		driver.findElement(webdriver.By.id('nameTxt')).sendKeys('Testing');
		driver.findElement(webdriver.By.id('keywordTxt')).sendKeys(webdriver.Key.CONTROL + 'a');
		driver.findElement(webdriver.By.id('keywordTxt')).sendKeys('testingKeyword');
		
		driver.findElement(webdriver.By.id('btnSave')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Profile saved)');
				done();
			});
		}, 3000);
	});
	
	it('should go back to news stories and find test news story there', function (done) {
		driver.findElement(webdriver.By.id('newsLink')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(News fetched)');
			});
			driver.findElement(webdriver.By.css('ul li:first-child div:nth-child(2) h b')).getInnerHtml().then(function (value) {
				assert.equal(value, 'testingKeyword title4');
				done();
			});
		}, 3000);
	});
	
	it('should save a news story', function (done) {
		driver.findElement(webdriver.By.linkText('Save')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Story saved)');
				done();
			});
		}, 3000);
	});
	
	it('should show a saved news story', function (done) {
		driver.findElement(webdriver.By.id('savedLink')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(News fetched)');
			});
			driver.findElement(webdriver.By.css('ul li:first-child div:nth-child(2) h b')).getInnerHtml().then(function (value) {
				assert.equal(value, 'testingKeyword title4');
				done();
			});
		}, 3000);
	});
	
	it('should share a news story', function (done) {
		driver.findElement(webdriver.By.linkText('Share')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Story shared)');
				done();
			});
		}, 3000);
	});
	
	it('should delete save a news story', function (done) {
		driver.findElement(webdriver.By.linkText('Delete')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Story deleted)');
				done();
			});
		}, 3000);
	});
	
	it('should show a shared news story', function (done) {
		driver.findElement(webdriver.By.id('sharedLink')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(News fetched)');
			});
			
			driver.findElement(webdriver.By.css('ul li:last-child div:nth-child(2) h b')).getAttribute("id").then(function (value) {
				storyID = value;
                //console.log("storyID is:" + storyID);
			});
			driver.findElement(webdriver.By.css('ul li:last-child div:nth-child(2) h b')).getInnerHtml().then(function (value) {
				assert.equal(value, 'testingKeyword title4');
				done();
			});
		}, 3000);
	});
	
	it('should comment on a news story', function (done) {
		driver.findElement(webdriver.By.css('ul li:last-child div:nth-child(2) a')).click();
		
		// In this case, we need to wait for the modal to appear and the controls to be visible
		driver.wait(webdriver.until.elementIsVisible(driver.findElement(webdriver.By.id('btnComment'))), 5000);
		driver.findElement(webdriver.By.id('txtComment')).sendKeys('I love this news story!');
		driver.findElement(webdriver.By.id('btnComment')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Comment added)');
				done();
			});
		}, 3000);
	});
	
	it("should allow registered user to login", function (done) {
		request.post("/api/sessions")
        .send({
			email: 'Testperson@blah.com',
			password: 'abc123*'
		})
        .end(function (err, res) {
			token = res.body.token;
			assert.equal(res.status, 201);
			assert.equal(res.body.msg, "Authorized", "Message should be AUthorized");
			done();
		});
	});
	
	it("should delete the shared news story", function (done) {
		request.del("/api/sharednews/" + storyID)
        .set('x-auth', token)
        .expect(200)
        .end(function (err, res) {
			assert.equal(res.status, 200);
			done();
		});
	});
	
	it('should open the news filters user profile', function (done) {
		driver.findElement(webdriver.By.id('profileLink')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Profile fetched)');
				done();
			});
		}, 3000);
	});
	
	it('should delete a registered user', function (done) {
		driver.findElement(webdriver.By.id('deleteLink')).click();
		
		//wait for the modal to come open and button visible and click the checkbox
		driver.wait(webdriver.until.elementIsVisible(driver.findElement(webdriver.By.id('btnUnRegister'))), 5000);
		driver.findElement(webdriver.By.id('chkUnRegister')).click();
		
		//wait for the button to be enabled
		driver.wait(webdriver.until.elementIsEnabled(driver.findElement(webdriver.By.id('btnUnRegister'))), 5000);
		driver.findElement(webdriver.By.id('btnUnRegister')).click();
		
		// In this case, currentMsgIndex take some time to update from its previous value, so wait for it
		setTimeout(function () {
			driver.findElement(webdriver.By.id('currentMsgIndex')).getInnerHtml().then(function (value) {
				assert.equal(value, '(Account deleted)');
				done();
			});
		}, 3000);
	});
});