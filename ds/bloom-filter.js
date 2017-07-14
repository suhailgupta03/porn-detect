const bloom = require('bloomfilter').BloomFilter;

/**
 * A Bloom filter is a space-efficient probabilistic data structure,
 * that is used to test whether an element is a member of a set. 
 * False positive matches are possible, but false negatives are not – in other words, 
 * a query returns either "possibly in set" or "definitely not in set". 
 * Elements can be added to the set, but not removed (though this can be addressed 
 * with a "counting" filter); the more elements that are added to the set, 
 * the larger the probability of false positives.
 * 
 * While risking false positives, Bloom filters have a strong space advantage over
 * other data structures for representing sets, such as self-balancing binary search trees, 
 * tries, hash tables, or simple arrays or linked lists of the entries. Most of these
 * require storing at least the data items themselves, which can require anywhere from
 * a small number of bits, for small integers, to an arbitrary number of bits, such 
 * as for strings (tries are an exception, since they can share storage between elements
 * with equal prefixes). However, Bloom filters do not store the data items at all, and 
 * a separate solution must be provided for the actual storage. Linked structures incur
 * an additional linear space overhead for pointers. A Bloom filter with 1% error and an 
 * optimal value of k, in contrast, requires only about 9.6 bits per element, regardless of 
 * the size of the elements. This advantage comes partly from its compactness, inherited 
 * from arrays, and partly from its probabilistic nature. The 1% false-positive rate 
 * can be reduced by a factor of ten by adding only about 4.8 bits per element.
 * 
 * Simple use case:
 * You've got a lot of data, on disk -- you decide on what error bound you want (e.g. 1%), 
 * that prescribes the value of m. Then the optimal k is determined 
 * You populate your filter from this disk-bound data once. Now you have the filter 
 * in RAM. When you need to process some element, you query your filter to see if it 
 * stands a chance of existing in your data set. If it doesn't, no extra work is done. 
 * No disk reads, etc. (Which you would have to do if it were a hash or tree, etc).
 */
module.exports = class BloomFilter {

    constructor(itemsExpected = 216553, acceptableFalsePositive = 0.001) {
        this.itemsExpected = itemsExpected;
        this.acceptableFalsePositive = acceptableFalsePositive;
        let calculated = this.calculator(this.itemsExpected, this.acceptableFalsePositive);
        this.numberOfBits = calculated.m;
        this.numberOfHashFunctions = calculated.k;
        this.bloom = new bloom(this.numberOfBits, this.numberOfHashFunctions);
    }

    /**
     * Calculates the number of bits needed in the bloom filter
     * and the number of hash functions we should apply.
     * m = -n*ln(p) / (ln(2)^2)  : the number of bits
     * k = m/n * ln(2) : the number of hash functions
     * 
     * @param {Number} itemsExpected how many items you expect to have in your filter
     * @param {Float} acceptableFalsePositive your acceptable false positive rate {0..1} (e.g. 0.01 → 1%)
     * @return {Object} {m : numberOfBits, k: numberOfHashFunctions}
     */
    calculator(itemsExpected, acceptableFalsePositive) {
        if ('number' === typeof itemsExpected)
            itemsExpected = parseInt(itemsExpected);
        else
            return new Error('Items expected has to be a number');

        if (!('number' === typeof acceptableFalsePositive && acceptableFalsePositive >= 0 && acceptableFalsePositive <= 1)) {
            return new Error('Probability of false positive has to be a number in the interval [0,1]');
        }

        const numberOfBits = Math.ceil(-(itemsExpected * Math.log(acceptableFalsePositive)) / (Math.pow(Math.log(2), 2)));

        const numberOfHashFunctions = Math.round(Math.log(2) * (numberOfBits / itemsExpected));

        return {
            m: numberOfBits,
            k: numberOfHashFunctions
        };
    }

    /**
     *  Hashes an item to one of the m array positions, generating a uniform 
     *  random distribution.
     * @param {any} item Item to hash
     */
    distributeHash(item) {
        this.bloom.add(item);
    }

    /**
     * Returns true if an item is probably in the set,
     * or false if an item is definitely not in the set.
     * 
     * Note: A bloom filter doesn't store the elements themselves, this is the crucial point.
     * You don't use a bloom filter to test if an element is present, you use it to test
     * whether it's certainly not present, since it guarantees no false negatives. 
     * @param {any} item 
     */
    doesExist(item) {
        return this.bloom.test(item);
    }
}