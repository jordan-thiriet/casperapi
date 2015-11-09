var express = require('express');
var Spooky = require('spooky');

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    var execution = {
        start: 'http://spallian.com/',
        username: '',
        password: '',
        commands : [
            {
                command: 'click',
                element: '//*[@id="menu-item-7376"]/a'
            },
            {
                command: 'sendkeys',
                element: '//*[@id="menu-item-7376"]/a',
                value: 'test'
            },
            {
                command: 'count',
                name: 'test',
                element: '//*[@id="post-7148"]/div/div'
            },
            {
                command: 'for',
                start: 1,
                end: 3,
                variable: 'test',
                commands: [
                    {
                        command: 'storevalue',
                        name: 'username{i}',
                        element: '//*[@id="post-7148"]/div/div[{i}]/div/div[2]/h5'
                    }
                ]
            },
            {
                command: 'if',
                element: '//*[@id="post-7148"]/div/div[1]/div/div[2]/h5',
                commands: [
                    {
                        command: 'storevalue',
                        name: 'username',
                        element: '//*[@id="post-7148"]/div/div[1]/div/div[2]/h5'
                    }
                ]
            }
        ]
    };
    var results = [];
    var variables = {};
    var spooky = new Spooky({
        child: {
            transport: 'http'
        },
        casper: {
            logLevel: 'debug',
            verbose: true,
            pageSettings: {
                loadImages:true,
                loadPlugins:true,
                userName: execution.username,
                password: execution.password
            }
        }
    }, function (err) {

        selectXPath = 'xPath = function(expression) {return {type: "xpath",path: expression,toString: function() {return this.type + " selector: " + this.path;}};};'

        if (err) {
            e = new Error('Failed to initialize SpookyJS');
            e.details = err;
            throw e;
        }
        var commands = execution.commands;
        spooky.start(execution.start);
        spooky.emit('command', commands, 0);
        spooky.then(function () {
            this.emit('finish');
        });
        spooky.run();
    });

    spooky.on('error', function (e, stack) {
        console.error(e);

        if (stack) {
            console.log(stack);
        }
    });

    spooky.on('command', function(commands, variable) {
        for(var i = 0; i<commands.length; i++) {
            spooky.then([{x: selectXPath, commands: commands,i: i, variable: variable}, function() {
                eval(x);
                var element = commands[i].element ? commands[i].element.replace(/{\w+}/, variable) : null;
                var value = commands[i].value ? commands[i].value.replace(/{\w+}/, variable) : null;
                var command = commands[i].command;
                var pass = false;
                switch (command) {
                    case 'for':
                        var iterator = commands[i].variable;
                        for(iterator=commands[i].start; iterator<=commands[i].end ; iterator++) {
                            this.emit('logcasper', iterator);
                            this.emit('command', commands[i].commands, iterator);
                        }
                        break;
                    case 'if':
                        if(this.exists(xPath(element))) {
                            this.emit('command', commands[i].commands, 0);
                        }
                        break;
                    case 'click' :
                        if(this.exists(xPath(element)))  {
                            this.thenClick(xPath(element));
                            this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, true, element);
                        } else {
                            this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, false, element);
                        }
                        break;
                    case 'sendkeys' :
                        if(this.exists(xPath(element)))  {
                            this.sendKeys(xPath(element), value);
                            this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, true, element, value);
                        } else {
                            this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, false, element, value);
                        }
                        break;
                    case 'open' :
                        this.thenOpen(value,function() {
                            this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, true, null, value);
                        });
                        break;
                    case 'geturl' :
                        this.emit('variable', 'url', this.getCurrentUrl());
                        break;
                    case 'count' :
                        var count = 0;
                        if(this.exists(xPath(element))) {
                            count = this.getElementsInfo(xPath(element)).length;
                        }
                        var name = commands[i].name ? commands[i].name : 'count';
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, true, element, count);
                        this.emit('variable', name, count);
                        break;
                    case 'capturebase64' :
                        var image = this.captureBase64('png', xPath(element));
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, true, element, image);
                        break;
                    case 'back' :
                        this.back();
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, true);
                        break;
                    case 'forward' :
                        this.forward();
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, true);
                        break;
                    case 'wait':
                    case 'waitphantom':
                        this.wait(value*1000);
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, true, null, value);
                        break;
                    case 'storevalue' :
                        var text = this.fetchText(xPath(element));
                        this.emit('variable', commands[i].name.replace(/{\w+}/, variable), text);
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, false, element, text);
                        break;
                    case 'assertequals' :
                        if(this.getHTML(xPath(element)) == value) {
                            pass = true;
                        }
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, pass, element, value);
                        break;
                    case 'assertcontains' :
                        if(this.getHTML(xPath(element)).match(value)) {
                            pass = true;
                        }
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, pass, element, value);
                        break;
                    case 'assertexist' :
                        if(casper.exists(xPath(element)))  {
                            pass = true;
                        }
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, pass, element);
                        break;
                    default :
                        this.emit('result', this.currentHTTPStatus, this.getCurrentUrl(), command, false);
                        break;

                }
            }]);
        }
    });

    spooky.on('logcasper', function (log) {
        console.log(log);
    });
    spooky.on('variable', function (name, value) {
        variables[name] = value;
    });
    spooky.on('result', function (currentHTTPStatus, currentUrl, functionName, pass, element, value) {
        value = value !== undefined ? value : null;
        var result = {
            status: currentHTTPStatus,
            date: new Date(),
            url: currentUrl,
            functionName: functionName,
            pass: pass,
            element: element,
            value: value
        };

        results.push(result);
    });
    spooky.on('finish', function () {
        res.send({results: results, variables: variables});
    });
});

module.exports = router;
