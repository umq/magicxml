/******************************************************************************
Magic XML by Tom Davies
-----------------------
Magically implements cross-browser code from w3schools.com/xsl/xsl_client.asp 
to pull in XML data and apply a specified XSLT on marked up elements.

More details at: http://www.t-davies.com/magicxml/

******************************************************************************/

/*

The MIT License (MIT)

Copyright (C) 2013 - Tom Davies (tom@t-davies.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
/**
 *
 * @param   {Object} root
 * @param   {function} factory
 *
 * @returns {Object}
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory();
	} else {
		root.magicXML = factory();
	}
}(this, function () {
	"use strict";

    // Declare variables as early as possible.
    var j = 0,
        element,
        elementParams,
        options = {
            xmlSourceAttribute: 'data-xml',
            xslSourceAttribute: 'data-xslt',
            xslParamAttribute: 'data-xsl-params',
            xmlStringParser: getXMLStringParser()
        };

    // Closure prevents access to supporting functions we need by placing them
    // in encapsulating function scope.

    /**
     *
     * @param   {String} candidate
     * @returns {boolean}
     */
    function isXML(candidate) {
        return (candidate.indexOf('<?xml version="1.0"') >= 0);
    }

    /**
     *
     * @param   {String} source 
     * @param   {Function} callback takes the Document as a parameter
     * @returns {undefined}
     */
    function loadXML(source, callback) {
        if  (isXML(source)) {
            callback(parseXMLString(source));
        }
        else {
            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400) {
                    callback(xhr.responseXML);
                }
            };
            xhr.open("GET", source);
            xhr.send();
        }
    }

    /**
     *
     * @param   {String} xmlString
     * @returns {Document|ActiveXObject}
     */
    function parseXMLString(xmlString) {
        return options.xmlStringParser.parse(xmlString);
    }

    /**
     *
     * @returns {{parse: parse}}
     */
    function getXMLStringParser() {
        var parse = function() {
            console.error('[Magic XML] No XML string parser available.');
        };
              
        if (window.DOMParser) {
            parse = function(xmlString) {
                var parser = new window.DOMParser();
                return parser.parseFromString(xmlString, "text/xml");
            };
        }
        else if (window.ActiveXObject || "ActiveXObject" in window) {
            parse = function(xmlString) {
                var dom = new ActiveXObject("Microsoft.XMLDOM");
                dom.async = false;
                dom.loadXML(xmlString);
                return dom;
            };
        }
        else {
            console.warn("[Magic XML] No XML string parser available. String " + 
                "parsing will fail if used.");
        }

        return {
            parse: parse
        };
    }

    /**
     *
     * @param   {String} source 
     * @param   {Function} callback takes the Document as a parameter
     * @returns {undefined}
     */
    function loadXSL(source, callback) {
        if (window.ActiveXObject || "ActiveXObject" in window) {
            var xsl = new ActiveXObject("MSXML2.FreeThreadedDOMDocument.6.0");
            xsl.async = false;
            if (isXML(source)) {
                xsl.loadXML(source);
            } 
            else {
                xsl.load(source);
            }
            callback(xsl);
    }
    else {
            // If we don't need to use ActiveX just get normally.
            loadXML(source, callback);
        }
    }

    /**
     *
     * @param   {String} xml
     * @param   {String} xsl
     * @param   {Array} parameters
     * @returns {DocumentFragment}
     */
    function getTransformFragment(xml, xsl, parameters) {
        var i = 0,
            parameter,
            xslt = new XSLTProcessor();

        xslt.importStylesheet(xsl);

        // If we have a parameters array, set the values in the XSLT.
        if (parameters !== undefined) {
            for (i; i < parameters.length; i++) {
                parameter = parameters[i];
                xslt.setParameter((parameter.xmlns !== undefined) ?
                    parameter.xmlns : null, // fix required null for FF
                    parameter.name,
                    parameter.value);
            }
        }
        return xslt.transformToFragment(xml, document);
    }

    /**
     *
     * @param   {String} xml
     * @param   {String} xsl
     * @param   {Array} parameters
     * @returns {DocumentFragment}
     */
    function getActiveXTransform(xml, xsl, parameters) {
        var i = 0,
            parameter,
            processor,
            template = new ActiveXObject("MSXML2.XSLTemplate.6.0");

        template.stylesheet = xsl;
        processor = template.createProcessor();
        processor.input = xml;

        // If we have a parameters array, set the values in the XSLT.
        if (parameters !== undefined) {
            for (i; i < parameters.length; i++) {
                parameter = parameters[i];
                processor.addParameter(parameter.name, parameter.value,
                    parameter.xmlns);
            }
        }

        processor.transform();
        return processor.output;
    }
    // End supporting function definitions.
    
        /**
         * Transforms an XML document using a specified XSLT, passing in any
         * XSLT parameters that are supplied and taking care of cross browser
         * compatability issues automatically.
         * 
         * @param   {String} xmlSource Path to file or whole document as string
         * @param   {String} xslSource Path to file or whole document as string
         * @param   {Array} parameters
         * @param   {Function} callback takes DocumentFragment as a parameter
         * @returns {undefined}
         */
        function _transform(xmlSource, xslSource, parameters, callback) {
            loadXML(xmlSource, function(xml) {
                loadXSL(xslSource, function(xsl) {
                    if (window.ActiveXObject || "ActiveXObject" in window) {
                        callback(getActiveXTransform(xml, xsl, parameters));
                    }
                    else {
                        callback(getTransformFragment(xml, xsl, parameters));
                    }
                });
            });
        }

        /**
         * Gets transformed version of an XML document using transform() then
         * replaces the content of a target DOM element with the result.
         *
         * @param   {String|Element} target Query selector or DOM node
         * @param   {String} xmlSource Path to file or whole document as string
         * @param   {String} xslSource Path to file or whole document as string
         * @param   {Array} parameters
         * @returns {undefined}
         */
        function _transformAndReplace(target, xmlSource, xslSource, parameters) {
            if (typeof target === 'string') {
                // If a query selector is passed in, then find the requested
                // DOM node else expect a DOM node to have been passsed.
                target = document.querySelector(target);
            }

            _transform(xmlSource, xslSource, parameters, function(transformed) {
                if (window.ActiveXObject || "ActiveXObject" in window) {
                    var n = document.createElement('div');
                    n.innerHTML = transformed;
                    target.parentNode.insertBefore(n.firstChild, target);
                    target.parentNode.removeChild(target);
                }
                else {
                    target.parentNode.replaceChild(transformed, target);
                }
            });
        }

        /**
         * Configures the script to use non-default names for attributes, and/or an alternative
         * XML string parser.
         *
         * @param   {String} xmlSourceAttribute Name of an attribute of a DOMElement used to define
         *                                       the source of xml-data (path to file or document as
         *                                       string)
         * @param   {String} xslSourceAttribute Name of an attribute of a DOMElement used to define
         *                                       the source of xsl-document (path to file or
         *                                       document as string)
         * @param   {String} xslParamAttribute
         * @param   {Object} xmlStringParser An object with one method named "parse"
         * @returns {undefined}
         */
        function _configure(xmlSourceAttribute, xslSourceAttribute,
            xslParamAttribute, xmlStringParser) {

            if (typeof xmlSourceAttribute === 'string')
                options.xmlSourceAttribute = xmlSourceAttribute;

            if (typeof xslSourceAttribute === 'string')
                options.xslSourceAttribute = xslSourceAttribute;

            if (typeof xslParamAttribute === 'string')
                options.xslParamAttribute = xslParamAttribute;

            if (typeof xmlStringParser === 'function')
                options.xmlStringParser = xmlStringParser;

        }

        /**
         * Search through the DOM for elements which match the specified
         * selector and apply transformAndReplace() to their contents where a
         * source XML and XSLT file are specified by attributes.
         *
         * If no selector is specified, will parse all elements on the page.
         *
         * @param   {String} selector Query selector to find DOM elements used to put the xslt
         *                            result, respecting the configured data-attributes
         * @returns {undefined}
         */
        function _parse(selector) {

            if (typeof selector !== 'string')
                selector = '';

            // Find all elements which are marked up to use Magic XML.
            var elements = document.querySelectorAll(selector +
                '[' + options.xmlSourceAttribute +
                '][' + options.xslSourceAttribute + ']');

            // Automatically deal with appropriately marked up DOM elements.
            for (j=0; j < elements.length; j++) {
                elementParams = undefined;
                element = elements[j];

                // Pull in any parameters the element may want to pass.
                if (element.attributes[options.xslParamAttribute]) {
                    elementParams = JSON.parse(element.attributes[options.xslParamAttribute].value);
                }

                _transformAndReplace(element,
                    element.attributes[options.xmlSourceAttribute].value,
                    element.attributes[options.xslSourceAttribute].value,
                    elementParams);
            }

            if (elements.length === 0) {
                // If no Magic XML marked up objects found, inform users in
                // case of mis-configuration.
                console.warn('[Magic XML] No magic detected on page, is script loaded after all DOM elements?');
            }
        }

    // Module-API
    // Declare Magic XML functionality.
    return {
        configure: _configure,
        transform: _transform,
        transformAndReplace: _transformAndReplace,
        parse: _parse
    };
}));