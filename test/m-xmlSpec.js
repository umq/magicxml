define(['m-xml'], function (Xsl) {
    "use strict";

    describe('A xsl transformator', function () {
        it('trys to transform some xml data', function () {
            expect(Xsl.transform('/base/test/TestData.xml', '/base/test/TestTransform.xsl').textContent).toBe('24');
        });
    });
});
