const PocketBase = require('pocketbase/cjs');
const readline = require('readline');

const pb = new PocketBase('https://api.yatramore.com');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createSchema() {
    console.log("=== PocketBase Cupid Schema Setup ===");

    rl.question('Enter your PocketBase Admin Email: ', async (email) => {
        rl.question('Enter your PocketBase Admin Password: ', async (password) => {
            try {
                console.log("Authenticating...");
                await pb.collection('_superusers').authWithPassword(email, password);
                console.log("Authenticated successfully!");
                console.log("Updating 'users' collection...");
                const usersCollection = await pb.collections.getOne("users");

                usersCollection.listRule = "@request.auth.id != ''";
                usersCollection.viewRule = "@request.auth.id != ''";
                usersCollection.createRule = "";
                usersCollection.updateRule = "id = @request.auth.id && @request.body.is_verified:isset = false && @request.body.DeletionApproved:isset = false && @request.body.banned:isset = false && @request.body.suspendedUntil:isset = false && (@request.body.verification_status:isset = false || @request.body.verification_status = 'pending') && @request.body.custom_swipe_limit:isset = false && @request.body.custom_superlike_limit:isset = false && @request.body.custom_total_limit:isset = false && @request.body.is_premium:isset = false && @request.body.verification_locked_until:isset = false";
                usersCollection.deleteRule = null;

                const existingFieldNames = usersCollection.fields.map(f => f.name);
                const desiredFields = [
                    { name: 'name', type: 'text', required: false },
                    { name: 'birthdate', type: 'date', required: false },
                    { name: 'birth_year', type: 'number', required: false },
                    { name: 'birth_month', type: 'number', required: false },
                    { name: 'is_verified', type: 'bool', required: false },
                    { name: 'is_premium', type: 'bool', required: false },
                    { name: 'custom_swipe_limit', type: 'number', required: false },
                    { name: 'custom_superlike_limit', type: 'number', required: false },
                    { name: 'custom_total_limit', type: 'number', required: false },
                    { name: 'DeletionRequested', type: 'bool', required: false },
                    { name: 'DeletionApproved', type: 'bool', required: false },
                    { name: 'suspendedUntil', type: 'date', required: false },
                    { name: 'banned', type: 'bool', required: false },
                    { name: 'gender', type: 'select', required: false, maxSelect: 1, values: ['Male', 'Female', 'Non-binary'] },
                    { name: 'religion', type: 'select', required: false, maxSelect: 1, values: ["Christianity", "Islam", "Hinduism", "Buddhism", "Sikhism", "Judaism", "Other"] },
                    { name: 'photos', type: 'file', required: false, maxSelect: 4, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
                    { name: 'verification_status', type: 'select', required: false, maxSelect: 1, values: ["none", "pending", "approved", "rejected"] },
                    { name: 'verification_locked_until', type: 'date', required: false },
                    { name: 'location', type: 'text', required: false },
                    { name: 'blocked_users', type: 'relation', required: false, collectionId: usersCollection.id, maxSelect: 10000 },
                    { name: 'preferredLanguage', type: 'text', required: false },
                    { name: 'lookingFor', type: 'select', required: false, maxSelect: 1, values: ["Any", "Male", "Female", "Non-binary"] },
                    { name: 'pref_age_min', type: 'number', required: false },
                    { name: 'pref_age_max', type: 'number', required: false },
                    { name: 'pref_religion', type: 'text', required: false },
                    { name: 'pref_country', type: 'text', required: false },
                    { name: 'last_active', type: 'date', required: false },
                    { name: 'ghost_read_receipts', type: 'bool', required: false },
                    { name: 'ghost_status', type: 'bool', required: false },
                    { name: 'bio', type: 'text', required: false },
                    { name: 'hobbies', type: 'json', required: false },
                    { name: 'is_profile_completed', type: 'bool', required: false }
                ];

                const mergedFields = [];

                for (const existingField of usersCollection.fields) {
                    const desired = desiredFields.find(f => f.name === existingField.name);
                    if (desired) {
                        mergedFields.push({ ...existingField, ...desired });
                    } else {
                        mergedFields.push(existingField);
                    }
                }

                for (const desired of desiredFields) {
                    if (!existingFieldNames.includes(desired.name)) {
                        mergedFields.push(desired);
                    }
                }

                usersCollection.fields = mergedFields;

                try {
                    await pb.collections.update(usersCollection.id, usersCollection);
                    console.log("Users collection updated successfully.");
                } catch (err) {
                    console.error("FAILED to update users collection:", JSON.stringify(err.data, null, 2));
                }


                async function createCollectionSafe(collectionData) {
                    try {
                        console.log(`Creating '${collectionData.name}' collection...`);
                        return await pb.collections.create(collectionData);
                    } catch (err) {
                        if (err.data && err.data.data && err.data.data.name && (err.data.data.name.code === 'validation_not_unique' || err.data.data.name.code === 'validation_collection_name_exists')) {
                            console.log(`-> '${collectionData.name}' collection already exists, updating rules and merging fields instead.`);
                            const existingCol = await pb.collections.getFirstListItem(`name="${collectionData.name}"`);

                            if (collectionData.fields && existingCol.fields) {
                                const existingFieldNames = existingCol.fields.map(f => f.name);
                                for (const newField of collectionData.fields) {
                                    if (!existingFieldNames.includes(newField.name)) {
                                        existingCol.fields.push(newField);
                                    }
                                }
                                collectionData.fields = existingCol.fields;
                            }

                            return await pb.collections.update(existingCol.id, collectionData);
                        }
                        console.error(`Full error for ${collectionData.name}:`, JSON.stringify(err.data, null, 2));
                        throw err;
                    }
                }

                await createCollectionSafe({
                    name: 'swipes',
                    type: 'base',
                    listRule: "swiper = @request.auth.id || (swiped_on = @request.auth.id && liked = true)",
                    viewRule: "swiper = @request.auth.id || (swiped_on = @request.auth.id && liked = true)",
                    createRule: "swiper = @request.auth.id && swiped_on != @request.auth.id",
                    updateRule: null,
                    deleteRule: null,
                    indexes: [
                        "CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_swipe ON swipes (swiper, swiped_on)"
                    ],
                    fields: [
                        { name: 'swiper', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, maxSelect: 1 },
                        { name: 'swiped_on', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, maxSelect: 1 },
                        { name: 'action', type: 'select', required: true, maxSelect: 1, values: ["like", "pass", "super_like"] },
                        { name: 'liked', type: 'bool', required: false },
                        { name: 'swipe_date', type: 'date', required: false }
                    ]
                });

                const matchesCollection = await createCollectionSafe({
                    name: 'matches',
                    type: 'base',
                    listRule: "user1 = @request.auth.id || user2 = @request.auth.id",
                    viewRule: "user1 = @request.auth.id || user2 = @request.auth.id",
                    createRule: "@request.auth.id = @request.body.user1",
                    updateRule: null,
                    deleteRule: "user1 = @request.auth.id || user2 = @request.auth.id",
                    indexes: [
                        "CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_match ON matches (user1, user2)"
                    ],
                    fields: [
                        { name: 'user1', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, maxSelect: 1 },
                        { name: 'user2', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, maxSelect: 1 }
                    ]
                });

                await createCollectionSafe({
                    name: 'messages',
                    type: 'base',
                    listRule: "match_id.user1 = @request.auth.id || match_id.user2 = @request.auth.id",
                    viewRule: "match_id.user1 = @request.auth.id || match_id.user2 = @request.auth.id",
                    createRule: "sender = @request.auth.id && (match_id.user1 = @request.auth.id || match_id.user2 = @request.auth.id)",

                    updateRule: "(match_id.user1 = @request.auth.id || match_id.user2 = @request.auth.id) && @request.body.match_id:isset = false && @request.body.sender:isset = false && @request.body.sent_at:isset = false && (sender = @request.auth.id || (@request.body.text:isset = false && @request.body.isDeleted:isset = false))",
                    deleteRule: null,
                    fields: [
                        { name: 'match_id', type: 'relation', required: true, collectionId: matchesCollection.id, cascadeDelete: true, maxSelect: 1 },
                        { name: 'sender', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, maxSelect: 1 },
                        { name: 'text', type: 'text', required: true },
                        { name: 'read', type: 'bool', required: false },
                        { name: 'isDeleted', type: 'bool', required: false },
                        { name: 'hiddenFor', type: 'json', required: false },
                        { name: 'starredBy', type: 'json', required: false },
                        { name: 'reactions', type: 'json', required: false },
                        { name: 'sender_theme', type: 'text', required: false },
                        { name: 'reply_to', type: 'text', required: false },
                        { name: 'reply_to_text', type: 'text', required: false },
                        { name: 'reply_to_sender', type: 'text', required: false },
                        { name: 'sent_at', type: 'date', required: false }
                    ]
                });

                await createCollectionSafe({
                    name: 'reports',
                    type: 'base',
                    listRule: null,
                    viewRule: null,
                    createRule: "reporter = @request.auth.id",
                    updateRule: null,
                    deleteRule: null,
                    fields: [
                        { name: 'reporter', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, maxSelect: 1 },
                        { name: 'reported_user', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, maxSelect: 1 },
                        { name: 'match_id', type: 'relation', required: false, collectionId: matchesCollection.id, maxSelect: 1 },
                        { name: 'reason', type: 'text', required: true },
                        { name: 'details', type: 'text', required: false },
                        { name: 'proof_photos', type: 'file', required: false, maxSelect: 4, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
                        { name: 'status', type: 'select', required: false, maxSelect: 1, values: ["pending", "dismissed", "actioned"] },
                        { name: 'suspendedUntil', type: 'date', required: false },
                        { name: 'banned', type: 'bool', required: false },
                        { name: 'reported_email', type: 'text', required: false },
                        { name: 'reported_birthdate', type: 'date', required: false },
                        { name: 'reported_photos_urls', type: 'json', required: false }
                    ]
                });

                await createCollectionSafe({
                    name: 'verifications',
                    type: 'base',
                    listRule: "user = @request.auth.id",
                    viewRule: "user = @request.auth.id",
                    createRule: "user = @request.auth.id && @request.body.status = 'pending'",
                    updateRule: null,
                    deleteRule: null,
                    fields: [
                        { name: 'user', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, maxSelect: 1 },
                        { name: 'name', type: 'text', required: true },
                        { name: 'birthdate', type: 'date', required: true },
                        { name: 'verification_selfie', type: 'file', required: true, protected: true, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
                        { name: 'verification_id', type: 'file', required: true, protected: true, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
                        { name: 'status', type: 'select', required: true, maxSelect: 1, values: ["pending", "approved", "rejected"] },
                        { name: 'submitted_at', type: 'date', required: false }
                    ]
                });

                await createCollectionSafe({
                    name: 'notifications',
                    type: 'base',
                    listRule: "user = @request.auth.id",
                    viewRule: "user = @request.auth.id",
                    createRule: null,
                    updateRule: "user = @request.auth.id && @request.body.user:isset = false && @request.body.type:isset = false && @request.body.message:isset = false && @request.body.related_user:isset = false",
                    deleteRule: "user = @request.auth.id",
                    fields: [
                        { name: 'user', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, maxSelect: 1 },
                        { name: 'type', type: 'select', required: true, maxSelect: 1, values: ["match", "verification_approved", "verification_rejected", "admin_warning", "system"] },
                        { name: 'message', type: 'text', required: true },
                        { name: 'is_read', type: 'bool', required: false },
                        { name: 'related_user', type: 'relation', required: false, collectionId: usersCollection.id, maxSelect: 1 }
                    ]
                });

                try {
                    const deletedMsgs = await pb.collection('messages').getFullList({ filter: 'isDeleted = true' });
                    let scrubbedCount = 0;
                    for (const msg of deletedMsgs) {
                        if (msg.text !== "" && msg.text !== "[Message Deleted]") {
                            await pb.collection('messages').update(msg.id, { text: "[Message Deleted]" });
                            scrubbedCount++;
                        }
                    }
                    if (scrubbedCount > 0) {
                        console.log(`\x1b[32mSuccessfully sanitized ${scrubbedCount} legacy deleted messages in the database.\x1b[0m`);
                    }
                } catch (err) {
                    console.log("\x1b[33mNote: Could not sanitize legacy messages (might be a new DB).\x1b[0m");
                }

                console.log("\x1b[32m\n=== Database Setup & Security Lock-down Complete! ===\x1b[0m");
                process.exit(0);
            } catch (err) {
                console.error("Error setting up schema:", err.message);
                if (err.data) {
                    console.error("Detailed validation errors:", JSON.stringify(err.data, null, 2));
                }
                process.exit(1);
            }
        });
    });
}

createSchema();
