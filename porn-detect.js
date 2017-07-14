const BloomFilter = require('./ds/bloom-filter');
let bfilter = new BloomFilter();

let pornLeads = [];

for(let lead of pornLeads) {
    // Randomly distribute the hash of a porn lead
    bfilter.distributeHash(lead);
}

global._porn_bloom_filter_ = bfilter;

//console.log(BloomFilter);
module.exports = class PornDetect {

    /**
     * Gives out the porn score based upon the <em>text</em> item sent
     * @param {any} item  
     */
    static pornScore(item) {
        let score = 90;

        if(_porn_bloom_filter_.doesExist(items))
            return score;
        else
            return 0;
    }
}
