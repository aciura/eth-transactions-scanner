# eth-scanner

## How it works

1. Scans pending transactions using Web3 in the scan-pending.service.
2. Saves new incoming transactions in the transactions.db.sqlite
3. Confirm.service then starts up each 30 secounds and checks for number of confirmations for new transactions.
4. Transactions that have more than 2 confirmations are saved in the transactions db with the blockNumber and status 'confirmed'
5. Each minute sendInfo() method is run and tries to send to *accounting* (I have some kafka issue so was not able to test it)
6. Accounting was modified to use a transaction hash as a uniqe key, to prevent from duplicated transfers.

TODO: Current solution reads only new transactions that appear after eth-scanner is started.
To enhance the system, I would use etherscan API to scan all *older* transactions,
e.g. API call: https://api.etherscan.io/api?module=account&action=txlist&address=0xddbd2b932c763ba5b1b7ae3b362eac3e8d40121a&startblock=0&endblock=99999999&sort=asc&apikey=YourApiKeyToken
Transactions from this call could be saved to transactions.db.sqlite, then Confirm.service would process them similarly to the other transactions coming from scan-pending.service.
However I didn't have enough time to implement this part.
