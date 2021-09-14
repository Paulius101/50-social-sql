const mysql = require('mysql2/promise');

const app = {}

app.init = async () => {
    // prisijungti prie duomenu bazes
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'social',
    });

    let sql = '';
    let rows = [];

    // LOGIC BELOW

    function firstCapital(str) {
        return str[0].toUpperCase() + str.slice(1);
    }

    function formatDate(time) {
        const d = new Date(time);
        const dformat = [d.getFullYear(), d.getMonth() + 1,
        d.getDate(),].join('-') + ' ' +
            [d.getHours(),
            d.getMinutes(),
            d.getSeconds()].join(':');
        return dformat
    }



    //**1** _Registruotu vartotoju sarasas, isrikiuotas nuo naujausio link 
    //seniausio. Reikia nurodyti varda, post'u kieki, komentaru kieki ir like'u kieki
    sql = 'SELECT `users`.`id`, `firstname`, \
    COUNT(DISTINCT `posts`.`id`) as posts, COUNT(DISTINCT `comments`.`id`) as comments, COUNT(DISTINCT `posts_likes`.`id`) as likes\
    FROM `users`\
    LEFT JOIN `posts`\
    ON `posts`.`user_id` = `users`.`id`\
    LEFT JOIN `comments`\
    ON `comments`.`user_id` = `users`.`id`\
    LEFT JOIN `posts_likes`\
    ON `posts_likes`.`user_id` = `users`.`id`\
    GROUP BY `users`.`id`\
    ORDER BY `register_date` DESC';
    [rows] = await connection.execute(sql);

    console.log(`Users: `);
    let i = 0;
    for (let item of rows) {
        console.log(`${++i}. ${firstCapital(item.firstname)}: posts (${item.posts}), comments (${item.comments}), likes (${item.likes});`);
    }

    //2
    sql = 'SELECT `users`.`firstname`, `posts`.`text`, `posts`.`date` \
        FROM `posts` \
        LEFT JOIN `users` \
            ON `users`.`id` = `posts`.`user_id` \
        LEFT JOIN `friends` \
            ON `friends`.`friend_id` = `posts`.`user_id` \
        WHERE `friends`.`user_id` = 2\
        ORDER BY `date` DESC';

    [rows] = await connection.execute(sql);
    console.log(rows);

    //3
    // sql = 'SELECT `posts`.`text`, `comments`.`text`, ';

    // [rows] = await connection.execute(sql);
    // console.log(rows);

    //4
    sql = 'SELECT `users`.`firstname`,\
    `friends`.`user_id`,\
    `friends`.`friend_id`,\
       ( \
        SELECT `users`.`firstname` \
        FROM `users` \
        WHERE `users`.`id` = `friends`.`friend_id` \
    ) as friendName, \
`friends`.`follow_date`\
    FROM `friends`\
    LEFT JOIN `users`\
    ON `friends`.`user_id` = `users`.`id`\
    ORDER BY `users`.`firstname` DESC';
    [rows] = await connection.execute(sql);
    let j = 0;
    // console.log(rows);
    console.log(`User's relationships:`);
    for (const entry of rows) {
        console.log(`${++j}. ${firstCapital(entry.firstname)} is following ${firstCapital(entry.friendName)} (since ${formatDate(entry.follow_date)})`);
    }


    // 5
    sql = 'SELECT `like_options`.`text`,\
    COUNT(`posts_likes`.`like_option_id`) as count \
    FROM `like_options`\
    LEFT JOIN `posts_likes`\
    ON `posts_likes`.`like_option_id` = `like_options`.`id`\
    GROUP BY `like_options`.`id`\
    ORDER BY `count` DESC';

    [rows] = await connection.execute(sql);
    console.log(rows);
    console.log(`Like options statistics:`);
    let number = 0;
    for (const entry of rows) {
        console.log(`${++number}. ${entry.text} - ${entry.count} time;`);
    }

    //6
    async function termFinder(term) {
        sql = 'SELECT `comments`.`text` as text, `comments`.`date` as time\
    FROM `comments`\
    WHERE text LIKE "%' + term + ' %" ';
        [rows] = await connection.execute(sql);
        if (rows.length === 0) {
            console.error(`Nerasta komentaru`);
        }
        else {
            let frazes = 0;
            console.log(`Comments with search term "${term}":`);
            for (const entry of rows) {
                console.log(`${++frazes}. ${entry.text} ${formatDate(entry.time)}`);
            }
        }
    }
    await termFinder('nice');
    await termFinder('lol');

    //7
    async function postFinder(userID) {
        sql = 'SELECT posts.text as text, posts.date as time, \
        posts.user_id, (SELECT users.firstname FROM users WHERE posts.user_id = users.id ) as name\
    FROM posts\
    WHERE user_id = '+ userID + '\
    GROUP BY time\
    ORDER BY time DESC';
        [rows] = await connection.execute(sql);
        console.log(rows);

        if (rows.length === 0) {
            console.error(`Seems like user hasn't posted yet.`);
        }
        else {

            console.log(`Latest post from ${rows[0].name}:`);
            console.log(`'${rows[0].text}' ${formatDate(rows[0].time)}.`);

        }

    }
    // await postFinder(1);
    await postFinder(6);
}


app.init();

module.exports = app;