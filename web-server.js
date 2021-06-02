const express = require("express");
const app = express();
const util = require('util');
const mysql = require("mysql");
var mysql_conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test-deptech",
    password: ""
});

// node native promisify
const query = util.promisify(mysql_conn.query).bind(mysql_conn);

app.listen(8000, function(){
    console.log('RESTFUL API SUDAH SIAP DIPAKAI');
});

app.use(express.urlencoded());
app.use(express.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, X-CSRF-TOKEN, Content-Type, Accept");
    next();
});

app.post('/api/inout/save', async function(req, res)
{
    
        var type_inout = req.body.type_inout;
        var notes = req.body.notes;
        var id_hdr = await query("INSERT INTO `inout` (type_inout, notes) VALUES ('"+ type_inout +"', '" + notes + "')");
        id_hdr = id_hdr.insertId;

        for(var anu = 0; anu < req.body.details.length; anu++)
        {
            var pid = req.body.details[anu].id_produk;
            var qty = req.body.details[anu].qty;
            var get_stok = await query("SELECT * FROM products WHERE id = " + pid);
            get_stok = JSON.parse(JSON.stringify(get_stok));

            var last_stok = 0;
            var values = "'"+ id_hdr +"', '"+ anu +"', '"+ pid +"', '"+ qty +"'";
            if(type_inout == 'In')
            {
                last_stok = Number(get_stok[0].stok) + Number(qty);
                var insert_query = await query("INSERT INTO `inout_detail` (id, id_detail, id_produk, qty) VALUES ("+values+")");
            }else{
                last_stok = Number(get_stok[0].stok) - Number(qty);
                var insert_query = await query("INSERT INTO `inout_detail` (id, id_detail, id_produk, qty) VALUES ("+values+")");
            }
            var update_query = await query("UPDATE products SET stok = '"+ last_stok +"' WHERE id = "+ pid);
        }

        res.send({'success': true});
});

app.get('/api/inout/data', function(req, res)
{
    mysql_conn.connect(function(err)
    {
        mysql_conn.query("SELECT * FROM `inout`", function(errorq, resultq){
            var tekumseh = [];
            for(var ie = 0; ie < resultq.length; ie++)
            {
                tekumseh[ie] = [
                    resultq[ie].created_at,
                    resultq[ie].type_inout,
                    resultq[ie].notes
                ];
            }

            return res.send({
                "draw": 1,
                "recordsTotal": resultq.length,
                "recordsFiltered": resultq.length,
                "data": tekumseh
            });
        });
    });
});