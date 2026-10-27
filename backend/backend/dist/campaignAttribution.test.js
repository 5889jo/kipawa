"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const campaignAttribution_1 = require("./campaignAttribution");
(0, vitest_1.describe)('campaign attribution', () => {
    (0, vitest_1.it)('accepts and trims known campaign fields', () => {
        (0, vitest_1.expect)((0, campaignAttribution_1.parseCampaignAttribution)({
            source: ' instagram ',
            medium: ' social ',
            campaign: ' october-intake '
        })).toEqual({
            success: true,
            data: {
                campaignSource: 'instagram',
                campaignMedium: 'social',
                campaignName: 'october-intake'
            }
        });
    });
    (0, vitest_1.it)('treats missing or empty attribution as absent', () => {
        (0, vitest_1.expect)((0, campaignAttribution_1.parseCampaignAttribution)(undefined)).toEqual({ success: true, data: null });
        (0, vitest_1.expect)((0, campaignAttribution_1.parseCampaignAttribution)({ source: ' ', medium: null, campaign: '' }))
            .toEqual({ success: true, data: null });
    });
    (0, vitest_1.it)('rejects malformed, overlong, or control-character values', () => {
        (0, vitest_1.expect)((0, campaignAttribution_1.parseCampaignAttribution)('instagram')).toEqual({ success: false });
        (0, vitest_1.expect)((0, campaignAttribution_1.parseCampaignAttribution)({ source: 4 })).toEqual({ success: false });
        (0, vitest_1.expect)((0, campaignAttribution_1.parseCampaignAttribution)({ source: 'x'.repeat(101) })).toEqual({ success: false });
        (0, vitest_1.expect)((0, campaignAttribution_1.parseCampaignAttribution)({ campaign: 'october\nintake' })).toEqual({ success: false });
    });
});
