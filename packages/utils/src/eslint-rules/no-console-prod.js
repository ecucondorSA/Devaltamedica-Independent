/**
 * ESLint rule to prevent console.* usage in production
 * Warns about potential PHI exposure in console statements
 */

module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow console.* statements in production',
            category: 'Best Practices',
            recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
            noConsoleProd: 'Unexpected console statement. Use logger service instead.',
            noConsolePHI: 'Console statement may expose PHI. Use logger service with proper sanitization.',
            noConsoleDebug: 'Console statement should not be in production code. Use logger service.',
        },
    },

    create(context) {
        const isProduction = process.env.NODE_ENV === 'production';
        const filename = context.getFilename();

        // Keywords that might indicate PHI
        const phiKeywords = [
            'patient', 'patientId', 'patientName', 'patientData',
            'medical', 'medicalRecord', 'diagnosis', 'symptoms',
            'prescription', 'medication', 'labResult', 'vitalSigns',
            'appointment', 'consultation', 'telemedicine', 'session',
            'authToken', 'token', 'password', 'ssn', 'dni'
        ];

        function checkForPHI(node) {
            if (node.arguments && node.arguments.length > 0) {
                const arg = node.arguments[0];

                // Check if argument is a string literal
                if (arg.type === 'Literal' && typeof arg.value === 'string') {
                    const value = arg.value.toLowerCase();

                    // Check for PHI keywords
                    for (const keyword of phiKeywords) {
                        if (value.includes(keyword.toLowerCase())) {
                            context.report({
                                node,
                                messageId: 'noConsolePHI',
                            });
                            return;
                        }
                    }
                }

                // Check if argument is a template literal
                if (arg.type === 'TemplateLiteral') {
                    const quasis = arg.quasis || [];
                    for (const quasi of quasis) {
                        if (quasi.value && quasi.value.raw) {
                            const value = quasi.value.raw.toLowerCase();
                            for (const keyword of phiKeywords) {
                                if (value.includes(keyword.toLowerCase())) {
                                    context.report({
                                        node,
                                        messageId: 'noConsolePHI',
                                    });
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }

        return {
            CallExpression(node) {
                if (node.callee.type === 'MemberExpression' &&
                    node.callee.object.name === 'console') {

                    const method = node.callee.property.name;

                    // In production, all console methods are forbidden
                    if (isProduction) {
                        context.report({
                            node,
                            messageId: 'noConsoleProd',
                        });
                        return;
                    }

                    // In development, warn about potential PHI
                    checkForPHI(node);

                    // Warn about debug statements
                    if (method === 'log' || method === 'debug') {
                        context.report({
                            node,
                            messageId: 'noConsoleDebug',
                        });
                    }
                }
            },
        };
    },
};
