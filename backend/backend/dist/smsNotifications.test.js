"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const smsNotifications_1 = require("./smsNotifications");
(0, vitest_1.describe)('course status SMS', () => {
    (0, vitest_1.it)('formats Tanzanian mobile numbers and preserves international numbers', () => {
        (0, vitest_1.expect)((0, smsNotifications_1.formatSmsPhoneNumber)('0712 345 678')).toBe('+255712345678');
        (0, vitest_1.expect)((0, smsNotifications_1.formatSmsPhoneNumber)('255 712 345 678')).toBe('+255712345678');
        (0, vitest_1.expect)((0, smsNotifications_1.formatSmsPhoneNumber)('+254 712 345 678')).toBe('+254712345678');
        (0, vitest_1.expect)((0, smsNotifications_1.formatSmsPhoneNumber)('0712 345 678', '254')).toBe('+254712345678');
        (0, vitest_1.expect)((0, smsNotifications_1.formatSmsPhoneNumber)('not a phone')).toBeNull();
    });
    (0, vitest_1.it)('includes the course and an action-specific next step in the SMS', () => {
        (0, vitest_1.expect)((0, smsNotifications_1.buildCourseStatusSms)('  Electrical   Installation ', 'request_application_changes'))
            .toBe('VETA Kipawa: Electrical Installation: Please update your application. Sign in to your account for details.');
    });
    (0, vitest_1.it)('does not call the provider without credentials', async () => {
        const fetchImpl = vitest_1.vi.fn();
        await (0, vitest_1.expect)((0, smsNotifications_1.sendAfricaTalkingSms)('0712345678', 'update', {}, fetchImpl))
            .resolves.toEqual({ status: 'not_configured' });
        (0, vitest_1.expect)(fetchImpl).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('sends a form-encoded message and reports provider acceptance', async () => {
        const fetchImpl = vitest_1.vi.fn().mockResolvedValue(new Response(JSON.stringify({
            SMSMessageData: {
                Recipients: [{ statusCode: 101, status: 'Success' }]
            }
        }), { status: 200 }));
        await (0, vitest_1.expect)((0, smsNotifications_1.sendAfricaTalkingSms)('0712345678', 'Progress updated', {
            username: 'kipawa',
            apiKey: 'test-key',
            senderId: 'KIPAWA',
            environment: 'sandbox'
        }, fetchImpl)).resolves.toEqual({ status: 'accepted' });
        (0, vitest_1.expect)(fetchImpl).toHaveBeenCalledWith('https://api.sandbox.africastalking.com/version1/messaging', vitest_1.expect.objectContaining({
            method: 'POST',
            headers: vitest_1.expect.objectContaining({ apiKey: 'test-key' }),
            body: new URLSearchParams({
                username: 'kipawa',
                to: '+255712345678',
                message: 'Progress updated',
                from: 'KIPAWA'
            })
        }));
    });
    (0, vitest_1.it)('uses the live API endpoint unless sandbox mode is explicitly configured', async () => {
        const fetchImpl = vitest_1.vi.fn().mockResolvedValue(new Response(JSON.stringify({
            SMSMessageData: { Recipients: [{ status: 'Success' }] }
        }), { status: 200 }));
        await (0, smsNotifications_1.sendAfricaTalkingSms)('0712345678', 'Progress updated', {
            username: 'kipawa',
            apiKey: 'test-key'
        }, fetchImpl);
        (0, vitest_1.expect)(fetchImpl).toHaveBeenCalledWith('https://api.africastalking.com/version1/messaging', vitest_1.expect.any(Object));
    });
    (0, vitest_1.it)('reports incomplete configuration and provider failures without claiming delivery', async () => {
        const fetchImpl = vitest_1.vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 }));
        await (0, vitest_1.expect)((0, smsNotifications_1.sendAfricaTalkingSms)('0712345678', 'update', { username: 'kipawa' }, fetchImpl))
            .resolves.toEqual({ status: 'failed', reason: 'incomplete_configuration' });
        await (0, vitest_1.expect)((0, smsNotifications_1.sendAfricaTalkingSms)('0712345678', 'update', {
            username: 'kipawa',
            apiKey: 'test-key'
        }, fetchImpl)).resolves.toEqual({ status: 'failed', reason: 'provider_http_503' });
    });
    (0, vitest_1.it)('rejects malformed or provider-rejected recipient results', async () => {
        for (const responseBody of [
            JSON.stringify({ SMSMessageData: { Recipients: [null] } }),
            JSON.stringify({ SMSMessageData: { Recipients: [{ status: 'Failed' }] } })
        ]) {
            const fetchImpl = vitest_1.vi.fn().mockResolvedValue(new Response(responseBody, { status: 200 }));
            await (0, vitest_1.expect)((0, smsNotifications_1.sendAfricaTalkingSms)('0712345678', 'update', {
                username: 'kipawa',
                apiKey: 'test-key'
            }, fetchImpl)).resolves.toEqual({ status: 'failed', reason: 'provider_rejected_message' });
        }
    });
});
