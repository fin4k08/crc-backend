const { CosmosClient } = require("@azure/cosmos");

// Environment variables from local.settings.json or Azure App Settings
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = process.env.COSMOS_DB_CONTAINER;

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
    const database = client.database(databaseId);
    const container = database.container(containerId);
    const id = "visitorCounter";
    const partitionKey = id;

    try {
        // Attempt to read the existing document
        const { resource: item } = await container.item(id, partitionKey).read();

        if (!item) {
            // If document doesn't exist, create it
            const newItem = { id, count: 1 };
            await container.items.create(newItem);

            context.res = {
                status: 200,
                body: { count: 1 }
            };
            return;
        }

        // If document exists, increment the count
        item.count = (item.count || 0) + 1;
        await container.item(id, partitionKey).replace(item);

        context.res = {
            status: 200,
            body: { count: item.count }
        };
    } catch (err) {
        context.log.error("Cosmos error:", err.message);
        context.res = {
            status: 500,
            body: { error: "Unable to update visitor count." }
        };
    }
};
