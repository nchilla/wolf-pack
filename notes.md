

```sql
-- all publications count
SELECT month, count FROM _grams_n1
LEFT JOIN (
    _sum_all_publications_n1 
) AS counts
ON _grams_n1.id = counts.gram_id
WHERE gram = 'while' AND month>='1975-01' AND MONTH<='2000-12'
ORDER BY month;

-- all pub count and total
SELECT month, counts.count AS count,_totals_n1.count AS total  FROM _grams_n1
LEFT JOIN (_sum_all_publications_n1 ) AS counts
ON _grams_n1.id = counts.gram_id
LEFT JOIN  _totals_n1 USING(month)
WHERE gram = 'while' AND month>='1975-01' AND month<='2000-12' AND _totals_n1.pub_id = 63
ORDER BY month;

-- get term count for one pub divided by total count for one pub
SELECT month, (CAST(counts.count AS FLOAT) / CAST(_totals_n1.count AS FLOAT)) AS val  FROM _grams_n1
LEFT JOIN (_sum_all_publications_n1 ) AS counts
ON _grams_n1.id = counts.gram_id
LEFT JOIN  _totals_n1 USING(month)
WHERE gram = 'while' AND month>='1975-01' AND month<='2000-12' AND _totals_n1.pub_id = 63
ORDER BY month;


-- get term count for multiple pubs divided by total count of multiple pubs - first attempt (responses are slow)
SELECT 
	month, 
	(CAST(SUM(counts.count) AS FLOAT) / CAST( SUM(_totals_n1.count) AS FLOAT)) AS val  
FROM _grams_n1
LEFT JOIN (
	SELECT * FROM arizona_republic_n1
	UNION ALL
    SELECT * FROM arkansas_democrat_gazette_n1
 ) AS counts
	ON _grams_n1.id = counts.gram_id
LEFT JOIN  _totals_n1 USING(month)
	WHERE gram = 'the' 
		AND month>='1975-01' AND month<='2000-12'
		AND  (_totals_n1.pub_id = 2  OR  _totals_n1.pub_id = 3)
	GROUP BY month ORDER BY month;


-- if it knows the id before it starts the query (much faster)
SELECT 
	month, 
	(CAST(SUM(counts.count) AS FLOAT) / CAST( SUM(_totals_n1.count) AS FLOAT)) AS val  
FROM (
	SELECT * FROM arizona_republic_n1 WHERE gram_id=1 AND month>='1975-01' AND month<='2000-12'
	UNION ALL
    SELECT * FROM arkansas_democrat_gazette_n1 WHERE gram_id=1 AND month>='1975-01' AND month<='2000-12'
 ) AS counts
LEFT JOIN  _totals_n1 USING(month)
		WHERE  (_totals_n1.pub_id = 2  OR  _totals_n1.pub_id = 3)
	GROUP BY month ORDER BY month;



-- same query with a bunch more pubs, performance not great but not terrible

SELECT 
	month, 
	(CAST(SUM(counts.count) AS FLOAT) / CAST( SUM(_totals_n1.count) AS FLOAT)) AS val  
FROM (
	SELECT * FROM abc_n1 WHERE gram_id=342 AND month>='1975-01' AND month<='2000-12'
	UNION ALL
	SELECT * FROM arizona_republic_n1 WHERE gram_id=342 AND month>='1975-01' AND month<='2000-12'
	UNION ALL
    SELECT * FROM arkansas_democrat_gazette_n1 WHERE gram_id=342 AND month>='1975-01' AND month<='2000-12'
	UNION ALL
    SELECT * FROM atlanta_journal_constitution_n1 WHERE gram_id=342 AND month>='1975-01' AND month<='2000-12'
	UNION ALL
    SELECT * FROM new_york_times_n1 WHERE gram_id=342 AND month>='1975-01' AND month<='2000-12'
 ) AS counts
LEFT JOIN  _totals_n1 USING(month)
		WHERE  (_totals_n1.pub_id = 1  OR _totals_n1.pub_id = 2  OR  _totals_n1.pub_id = 3  OR  _totals_n1.pub_id = 4 OR  _totals_n1.pub_id = 38) 
	GROUP BY month ORDER BY month;

```


```js

`SELECT 
	month, 
	(CAST(SUM(counts.count) AS FLOAT) / CAST( SUM(_totals_n${n}.count) AS FLOAT)) AS val  
FROM (
	SELECT * FROM abc_n${n} WHERE gram_id=${gram_id} AND month>='1975-01' AND month<='2000-12'
	UNION ALL
	SELECT * FROM arizona_republic_n${n} WHERE gram_id=${gram_id} AND month>='1975-01' AND month<='2000-12'
 ) AS counts
LEFT JOIN  _totals_n${n} USING(month)
		WHERE  (_totals_n${n}.pub_id = 1  OR _totals_n${n}.pub_id = 2  ) 
	GROUP BY month ORDER BY month;`


```
for each term:
1. define `n`` using count_n(gram)
2. get `gram_id` of term from corresponding gram table
	- if it doesn't exist, return "insufficient data found" message
	- if it does:
3. create the start structure using n, like so:
	- `SELECT month, (CAST(SUM(counts.count) AS FLOAT) / CAST( SUM(_totals_n${n}.count) AS FLOAT)) AS val FROM`
4. for each publication:
	1. Generate a SELECT statement in the following form, and push it to an array 
		- `SELECT * FROM ${pub.key}_n${n} WHERE gram_id=${gram_id} AND month>='1975-01' AND month<='2000-12'`
	2. Generate a conditional to find that pub in the totals table in the following form, and push it to an array
		- `_totals_n${n}.pub_id = ${pub.id}`
5. Join the select statements and the conditionals, respectively
	- like so: `let select_string = " (" + ${selects.join('\nUNION ALL\n')}  + ") AS COUNTS " `
	- and like so: `let totals_join_string = "\nLEFT JOIN _totals_${n} USING(month) WHERE (" + conditionals.join('\n OR ') + ")"`
6. Put it all together like so:
	- `let query_string = start + select_string + totals_join_string + " \nGROUP BY month ORDER BY month;"`