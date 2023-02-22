const AWS = require('aws-sdk');

export const getCurrentSpending = async () => {
    const costExplorer = new AWS.CostExplorer();

    // Set the time period for the query to the current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Define the Cost Explorer query parameters
    const params = {
        TimePeriod: {
            Start: startDate.toISOString().split('T')[0],
            End: endDate.toISOString().split('T')[0]
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost']
    };

    const data = await costExplorer.getCostAndUsage(params).promise();
    return data.ResultsByTime[0].Total.UnblendedCost.Amount
}
