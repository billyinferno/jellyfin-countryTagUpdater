<template>
    <div class="container">
        <div id="inputForm" class="submitForm">
            <!-- form start here -->
            <el-row class="formRow">
                <el-input placeholder="Jellyfin URL" v-model="jfURL" class="input-with-select">
                    <el-select v-model="jfProto" slot="prepend" placeholder="protocol">
                        <el-option label="http://" value="http://"></el-option>
                        <el-option label="https://" value="https://"></el-option>
                    </el-select>
                </el-input>
            </el-row>
            <el-row class="formRow">
                <el-input placeholder="Username" v-model="jfUsername">
                    <template slot="prepend">Username</template>
                </el-input>
            </el-row>
            <el-row class="formRow">
                <el-input placeholder="Folder" v-model="jfFolder">
                    <template slot="prepend">Folder</template>
                </el-input>
            </el-row>
            <el-row class="formRow">
                <el-input placeholder="Jellyfin API" v-model="jfAPI">
                    <template slot="prepend">Jellyfin API Key</template>
                </el-input>
            </el-row>
            <el-row class="formRow">
                <el-input placeholder="TMDB API" v-model="tmdbAPI">
                    <template slot="prepend">TMDB API Key</template>
                </el-input>
            </el-row>
            <el-row class="formRow">
                <el-col :span="8">
                    <el-checkbox v-model="getAllMovie">Get All Movie</el-checkbox>
                </el-col>
                <el-col :span="8">
                    <el-checkbox v-model="replaceTags">Replace Tags</el-checkbox>
                </el-col>
                <el-col :span="8">
                    Total Movies : {{ totalMovie }}
                </el-col>
            </el-row>
            <el-row :gutter="20" class="formRow">
                <el-col :span="8">
                    <el-button :disabled="isGetMovieLoading || isFetchingTMDB || isUpdateMetadata" :loading="isGetMovieLoading" type="primary" round style="width:100%;" v-on:click="getMovie">Get Movie</el-button>
                </el-col>
                <el-col :span="8">
                    <el-button :disabled="(jfMovieList.length <= 0) || isGetMovieLoading || isFetchingTMDB || isUpdateMetadata || tmdbAPI === ''" :loading="isFetchingTMDB" type="primary" round style="width:100%;" v-on:click="forceRefreshTMDB">Force TMDB</el-button>
                </el-col>
                <el-col :span="8">
                    <el-button :disabled="(jfMovieList.length <= 0) || isGetMovieLoading || isFetchingTMDB || isUpdateMetadata" :loading="isUpdateMetadata" type="primary" round style="width:100%;" v-on:click="forceUpdateMetadata">Update Tag</el-button>
                </el-col>
            </el-row>
        </div>
        <div id="progressBar" class="tableContainer formRow">
            <el-progress :text-inside="true" :stroke-width="24" :percentage="currentProgress" style="width:100%;" :format="formatProgressBar"></el-progress>
        </div>
        <div id="resultTable" class="tableContainer formRow">
            <!-- the table result -->
            <el-table :data="jfDisplayList" v-loading="isGetMovieLoading || isPageChange" height="480px" style="width:100%;">
                <el-table-column fixed label="NAME" width="400">
                    <template v-slot:default="scope">
                        {{ scope.row.name }}&nbsp;<i v-if="scope.row.tag_exist" class="el-icon-success successIcon"></i>
                    </template>
                </el-table-column>
                <el-table-column prop="tmdb" label="TMDB" width="85"></el-table-column>
                <el-table-column prop="imdb" label="IMDB" width="85"></el-table-column>
                <el-table-column label="COUNTRY" width="320">
                    <template v-slot:default="scope">
                        <el-tag v-for="tag in scope.row.country" :key="tag" type="info" disable-transitions closable size="mini" @close="removeTag(scope.$index, tag)">{{tag}}</el-tag>
                        <el-popover placement="top" title="Add Tags" width="200" trigger="click">
                            <el-input class="inputNewTag" v-model="inputTagValue" size="mini" @keyup.enter.native="handleInputTagConfirm(scope.$index)" @blur="handleInputTagConfirm(scope.$index)"></el-input>
                            <el-button slot="reference" type="info" class="tagAddButton">+</el-button>
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column fixed="right" label="ACTION" width="90">
                    <template v-slot:default="scope">
                        <el-button :disabled="isGetMovieLoading || (scope.row.tmdb === '') || isUpdateMetadata || isFetchingTMDB || tmdbAPI === ''" :loading="isFetchingTMDB" type="primary" icon="el-icon-refresh" v-on:click="fetchTMDB(scope.$index, scope.row.tmdb, true)" size="mini" circle></el-button>
                        <el-button :disabled="isGetMovieLoading || (scope.row.country.length <= 0) || isUpdateMetadata || isFetchingTMDB" :loading="isUpdateMetadata" type="primary" icon="el-icon-upload2" v-on:click="updateMetadata(scope.$index, true)" size="mini" circle></el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <div id="resultPagination" class="tableContainer formRow">
            <el-pagination :disabled="isGetMovieLoading || isFetchingTMDB || isUpdateMetadata" background layout="prev, pager, next" :page-size="displayedRecord" :current-page.sync="currentPage" :total="totalMovie" @current-change="handlePageChange"></el-pagination>
        </div>
        <div id="copyrightNote" class="submitForm copyrightNote">
            copyright &copy; 2020 - adimartha/billyinferno
        </div>
    </div>
</template>

<script>
import { JFApi } from "@/mixins/JFApi";
export default {
    name: 'CountryTagUpdater',
    mixins: [JFApi],
    data() {
        return {
            inputTagVisible: false,
            inputTagValue: '',
            isGetMovieLoading: false,
            isFetchingTMDB: false,
            isUpdateMetadata: false,
            isPageChange: false,
            getAllMovie: true,
            replaceTags: true,
            totalMovie: 0,
            numMovieScanned: 0,
            currentProgress: 0,
            jfProto: 'http://',
            jfURL: '',
            jfUsername: '',
            jfFolder: '',
            jfAPI: '',
            tmdbAPI: '',
            // this is all jellyfin user data
            jfUserID: '',
            jfServerID: '',
            jfParentID: '',
            jfMovieList: [],
            jfDisplayList: [],
            // pagination handling
            currentPage: 1,
            displayedRecord: 100,
        }
    },
    methods: {
        // ----------------------------------
        // ----- COMPONENT MANIPLUATION -----
        // ----------------------------------
        formatProgressBar() {
            if(this.numMovieScanned >= this.totalMovie) {
                return 'Complete';
            }
            else {
                return ''+this.numMovieScanned + '/' + this.totalMovie;
            }
        },
        generateDisplayList() {
            // here we will generate the list that will be displayed on the table.
            // we can use "computed", but everytimes I used computed it always showed Vue Warn message
            // even though the "scope-slot" is working correctly (data displayed).
            //
            // so instead tinkering with that, I think creating our own method during the handle change
            // also will resulted to be the same, since there are no absolutely correct way in the
            // programming also. so, why not?

            // here we need to calcuylate the startIndex and endIndex to knew which data we will need
            // to be put on the display list.
            var startIndex = ((this.currentPage - 1) * this.displayedRecord);
            var endIndex = (this.currentPage * this.displayedRecord);
            // check if endIndex > totalMovie, because if it's > then just end at totalMovie
            if (endIndex > this.totalMovie) { endIndex = this.totalMovie; }

            // now make the display list into empty first, before we will fill it later on.
            this.jfDisplayList = [];

            // after that we can loop from startIndex to endIndex
            for(var i=startIndex; i<endIndex; i++) {
                this.jfDisplayList.push(this.jfMovieList[i]);
            }

            // the page change should be set into false here, because by right it only going to be set
            // into true only during handlePageChange.
            this.isPageChange = false;
        },
        handlePageChange(val) {
            // make the table to be looks like it's loading, just for the "eye" pleasure
            this.isPageChange = true;

            // here we will handle the page changes occurs for the result table
            this.currentPage = val;

            // call the generateDisplayList to generate the display that we will need to get
            this.generateDisplayList();
        },
        // ---------------------------
        // ----- HELPER FUNCTION -----
        // ---------------------------
        showMsg(msg, typ) {
            this.$message({
                message: msg,
                type: typ,
            });
        },
        printlog(head, msg) {
            // print colored log based on the type.
            var headColor;
            switch (head) {
                case 'error':
                    headColor = 'background:#a10000 ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff';
                    break;
                case 'warn':
                    headColor = 'background:#9e5a00 ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff';
                    break;
                case 'info':
                    headColor = 'background:#004288 ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff';
                    break;
                case 'debug':
                    headColor = 'background:#006e09 ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff';
                    break;
                default:
                    headColor = 'background:#303030 ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff';
                    break;
            }
            switch (head) {
                case 'error':
                    console.error(
                        `%c ` + head + ` %c ` + msg + ` %c`,
                        headColor,
                        'background:#f1f1f1 ; padding: 1px; border-radius: 0 3px 3px 0;  color: rgb(36, 36, 36)',
                        'background:transparent'
                    );
                    break;
                case 'warn':
                    console.warn(
                        `%c ` + head + ` %c ` + msg + ` %c`,
                        headColor,
                        'background:#f1f1f1 ; padding: 1px; border-radius: 0 3px 3px 0;  color: rgb(36, 36, 36)',
                        'background:transparent'
                    );
                    break;
                case 'info':
                    console.info(
                        `%c ` + head + ` %c ` + msg + ` %c`,
                        headColor,
                        'background:#f1f1f1 ; padding: 1px; border-radius: 0 3px 3px 0;  color: rgb(36, 36, 36)',
                        'background:transparent'
                    );
                    break;
                case 'debug':
                    console.debug(
                        `%c ` + head + ` %c ` + msg + ` %c`,
                        headColor,
                        'background:#f1f1f1 ; padding: 1px; border-radius: 0 3px 3px 0;  color: rgb(36, 36, 36)',
                        'background:transparent'
                    );
                    break;
                default:
                    console.log(
                        `%c ` + head + ` %c ` + msg + ` %c`,
                        headColor,
                        'background:#f1f1f1 ; padding: 1px; border-radius: 0 3px 3px 0;  color: rgb(36, 36, 36)',
                        'background:transparent'
                    );
                    break;
            }
        },
        getIndex(idx) {
            // due to pagination the scope.index will return the row number which not actually represent
            // where is the data being stored on the actual movie list, hence we need to actually compute
            // the actual index number when the row is being manipulated (eithger add tag, remove tag,
            // refresh, update, etc).
            return (((this.currentPage - 1) * this.displayedRecord) + idx);
        },
        // -------------------------
        // ----- MAIN FUNCTION -----
        // -------------------------
        /**
         * getUserList
         * This function will perform API call to Jellyfin to get the userid that will be used
         * to perform any fetch and update on the metadata.
         * 
         * Return:
         * - true if success
         * - false if failed
         *  */ 
        async getUserList() {
            var urlUserList = this.jfProto + this.jfURL + '/Users/';
            this.printlog('info', "Get User List from: " + urlUserList);

            // perform API call to Jellyfin to get list of user
            try {
                const res = await this.jfApiGet(urlUserList, this.jfAPI);
                // check if status is 200
                if(res.status === 200) {
                    // loop thru all the data and check if we found the username or not?
                    for(var i=0; i<res.data.length; i++) {
                        // check if any name the same or not?
                        this.printlog('debug', "(" + res.data[i].Id + ") " + res.data[i].Name + '=>' + res.data[i].Policy.IsAdministrator);
                        if(this.jfUsername == res.data[i].Name) {
                            // username found, ensure that this is an administrator
                            if(res.data[i].Policy.IsAdministrator) {
                                // get the userID for this user
                                this.jfUserID = res.data[i].Id;
                                this.printlog('debug', "Get UserID : " + this.jfUserID);
                                return true;
                            }
                            else {
                                this.printlog('warn', "<getUserList> - Username " + this.jfUsername + " is not Admin");
                                this.showMsg("Username " + this.jfUsername + " is not admin.", 'warning');
                                return false;
                            }
                        }
                    }
                    // if we reach here it means we didn't found any user name
                    this.printlog('error', "<getUserList> - Username " + this.jfUsername + " not found.");
                    this.showMsg("Cannot found Username: " + this.jfUsername + " in the user list.", 'error');
                    return false;
                }
                else {
                    this.printlog('error', "<getUserList> - Error when connecting to Jellyfin with status: " + res.status);
                    this.showMsg("Error when connecting to Jellyfin with status " + res.status, 'error');
                    return false;
                }
            } catch (ex) {
                this.printlog('error', "<getUserList> - " + ex);
                this.showMsg("Error when connecting to Jellyfin.\n" + ex, 'error');
                return false;
            }
        },
        /**
         * getItemList
         * This function will perform API call to get the Parent ID of the folder that we will
         * list and perform update on the metadata.
         * 
         * Return:
         * - true if success
         * - false if failed
         */
        async getItemList() {
            var urlItemList = this.jfProto + this.jfURL + '/Items?UserId=' + this.jfUserID;
            this.printlog('info', "Get Item List for user: " + this.jfUsername + " (" + this.jfUserID + ")");
            
            // perform API call to Jellyfin to get list of items
            try {
                const res = await this.jfApiGet(urlItemList, this.jfAPI);
                // check if status is 200
                if(res.status === 200) {
                    // check the total record count to ensure that we have collection
                    if(res.data.TotalRecordCount > 0) {
                        // now loop thru all the items
                        for(var i=0; i<res.data.Items.length; i++) {
                            // check if the name of the folder is the same
                            if(this.jfFolder == res.data.Items[i].Name) {
                                // check if this is movie or not?
                                if(res.data.Items[i].CollectionType == "movies") {
                                    // correct one!
                                    // get the id of this collection, since we will use this parent ID to get all the movie list
                                    this.jfParentID = res.data.Items[i].Id;
                                    this.printlog('debug', "Got ParentID : " + this.jfParentID);
                                    return true;
                                }
                                else {
                                    // this is not movie
                                    this.printlog('warn', "Folder " + this.jfFolder + " is not a movies.");
                                    this.showMsg("Folder " + this.jfFolder + " is not a Movies Collection folder.", 'warning');
                                    return false;
                                }
                            }
                        }

                        // if we reached here, it means that the folder is not exists
                        // showed message to user.
                        this.showMsg("Folder " + this.jfFolder + " is not exist in library.", 'warning');
                        return false;
                    }
                    else {
                        this.printlog('warn', "<getItemList> - No collection");
                        this.showMsg("No collection found on Jellyfin", 'warning');
                        return false;
                    }
                }
                else {
                    this.printlog('error', "<getItemList> - Error when connecting to Jellyfin with status: " + res.status);
                    this.showMsg("ERROR when connecting to Jellyfin with status " + res.status, 'error');
                    return false;
                }
            } catch (ex) {
                this.printlog('error', "<getUserList> - " + ex);
                this.showMsg("Error when connecting to Jellyfin.\n" + ex, 'error');
                return false;
            }
        },
        /**
         * getMovieDetails
         * This function will perform API call to get the detail information of the movie, that will be
         * used as base data when we want to check what kind of metadata being stored on the movie it self.
         * 
         * The metadata response here will be later mapped to be used as reference for the existing fields
         * that we don't want to touch/update.
         * 
         * Argumenst:
         * - movieID : the ID of the movie that we will look on the library
         * 
         * Return:
         * - movie detail in JSON format if success
         * - null if failed
         */
        async getMovieDetails(movieID) {
            var urlMovieDetail = this.jfProto + this.jfURL + '/Users/' + this.jfUserID + '/Items/' + movieID + '/';
            
            // perform API call to Jellyfin to get list of items
            try {
                const res = await this.jfApiGet(urlMovieDetail, this.jfAPI);
                // check if status is 200
                if(res.status === 200) {
                    // return all the data and let the caller who will select, what kind of data that they will need
                    return res.data;
                }
                else {
                    this.printlog('error', "<getItemList> - Error when connecting to Jellyfin with status: " + res.status);
                    this.showMsg("Error when connecting to Jellyfin with status " + res.status, 'error');
                    return null;
                }
            } catch (ex) {
                this.printlog('error', "<getUserList> - " + ex);
                this.showMsg("Error when connecting to Jellyfin.\n" + ex, 'error');
                return null;
            }
        },
        /**
         * getMovieList
         * This function will get list of the movies on the folder based on the user id and parent id that
         * already got before.
         * 
         * The movie will be put on the array and sorted based on the movie name before further processing.
         * 
         * End result of this function is to filled the Jellyfin Movie List variable that will be used as
         * a reference for all the processing of this application.
         * 
         * Return:
         * N/A
         */
        async getMovieList() {
            var urlMovieList = this.jfProto + this.jfURL + '/Items?UserId=' + this.jfUserID + '&ParentId=' + this.jfParentID;
            this.printlog('info', "Get Movie List from from " + this.jfFolder + " (" + this.jfParentID + ") start at " + Date().toString());
            
            // perform API call to Jellyfin to get list of items
            try {
                const res = await this.jfApiGet(urlMovieList, this.jfAPI);
                var det;
                var isTagExists;
                var isSkipped;
                var providerIdTMDB;
                var providerIdIMDB;
                var rawProductionLocation;
                var currentTags;
                var i,j;
                // check if status is 200
                if(res.status === 200) {
                    // check the total record count to ensure that we have collection
                    if(res.data.TotalRecordCount > 0) {
                        // initialize the movie list
                        this.jfMovieList = [];
                        // initialize the progress bar computation
                        this.totalMovie = res.data.TotalRecordCount;
                        this.numMovieScanned = 0;

                        // sorted the items data
                        res.data.Items.sort(function(a, b) {
                            var x = a.Name.toLowerCase();
                            var y = b.Name.toLowerCase();
                            if (x < y) { return -1; }
                            if (x > y) { return  1; }
                        });

                        // now loop thru all the items
                        for(i=0; i<res.data.Items.length; i++) {
                        //for(i=0; i<20; i++) {
                            // initialize the isTagExists, and isSkipped flag
                            isTagExists = false;
                            isSkipped = false;

                            // get movie details
                            det = await this.getMovieDetails(res.data.Items[i].Id);
                            
                            // check if tags already exists or not?
                            // this is will helpful later on when we want to populate the production locations.
                            if(det.Tags.length > 0) {
                                // got tag, now check what tags is already being put on the movie
                                for(j=0; j<det.Tags.length; j++) {
                                    // check the tag
                                    if(det.Tags[j].substr(0,2) === "🌍") {
                                        // this movie already updated, skip!
                                        isTagExists = true;
                                        break;
                                    }
                                }
                            }

                            // check whether the filter is active or not?
                            if(!this.getAllMovie) {
                                // if getAllMovie filter is unchecked, then ensure that we will skip the records
                                // that already got the tags.
                                if(isTagExists) {
                                    isSkipped = true;
                                }
                            }

                            // once we reach here, check whether this data need to be skipped or not?
                            if(!(isSkipped)) {
                                // data not being skipped
                                // we will only going to bring below data to be displayed on the table
                                // once got the data, populate the movielist with relevant data from the details
                                // such as:
                                // ProviderID (TMDB, and IMDB)
                                // ProductionLocations
                                providerIdTMDB = '';
                                providerIdIMDB = '';
                                rawProductionLocation = [];
                                currentTags = [];
                                if (!(det===null)) {
                                    if(!(typeof det.ProviderIds.Imdb === 'undefined')) {
                                        providerIdIMDB = det.ProviderIds.Imdb;
                                    }
                                    if(!(typeof det.ProviderIds.Tmdb === 'undefined')) {
                                        providerIdTMDB = det.ProviderIds.Tmdb;
                                    }
                                    if(!(typeof det.Tags === 'undefined')) {
                                        currentTags = det.Tags;
                                    }
                                    // use the isTagExists that we checked above, we can determine the correct
                                    // production location that we need to populate, either it cames from the current
                                    // tag, or come from production locations fields from Jellyfin response.
                                    if(isTagExists && currentTags.length > 0) {
                                        // tags already exists, populate from current tags
                                        for(j=0; j<currentTags.length; j++) {
                                            rawProductionLocation.push(currentTags[j].replace('🌍', '').trim());
                                        }
                                    }
                                    else {
                                        // tags is not yet exists, populate from production location
                                        if(!(typeof det.ProductionLocations === 'undefined')) {
                                            // check if production locations more than 0
                                            if(det.ProductionLocations.length > 0) {
                                                // join all array with ","
                                                rawProductionLocation = det.ProductionLocations;
                                            }
                                        }
                                    }
                                }
                                this.jfMovieList.push({
                                    "tag_exist":isTagExists,
                                    "name":res.data.Items[i].Name,
                                    "id":res.data.Items[i].Id,
                                    "tmdb":providerIdTMDB,
                                    "imdb":providerIdIMDB,
                                    "country":rawProductionLocation,
                                    "current_tags":currentTags
                                });
                            }

                            // add the number of movie already scanned
                            this.numMovieScanned++;
                            // compute current progress
                            this.currentProgress = (this.numMovieScanned / this.totalMovie) * 100;
                        }
                        // all is finished
                        // since we might be filter the movie list, then recalculate the total movie being
                        // displayed, by counting the total record in jfMovieList.
                        // in case no filter it will give the same result.
                        this.totalMovie = this.jfMovieList.length;

                        // showed the log how log it take
                        this.printlog('info', "Get Movie List from from " + this.jfFolder + " (" + this.jfParentID + ") end at " + Date().toString());
                        return true;
                    }
                    else {
                        this.printlog('warn', "<getItemList> - No collection");
                        this.showMsg("No collection found on Jellyfin", 'warning');
                        return false;
                    }
                }
                else {
                    this.printlog('error', "<getItemList> - Error when connecting to Jellyfin with status: " + res.status);
                    this.showMsg("Error when connecting to Jellyfin with status " + res.status, 'error');
                    return false;
                }
            } catch (ex) {
                this.printlog('error', "<getUserList> - " + ex);
                this.showMsg("Error when connecting to Jellyfin.\n" + ex, 'error');
                return false;
            }
        },
        /**
         * getMovie
         * This function is used to perform all the function needed to get the Jellyfin Library specified
         * on the web interface.
         * 
         * Below is the function that being called when Get Movie button is pressed:
         * - getUserList
         *   - getItemList
         *     - getMovieList
         *       - getMovieDetails for each movie in getMovieList
         * 
         * All the validation will be handled by each other function.
         * 
         * Return:
         * N/A
         */
        async getMovie() {
            this.printlog('info', "Get Movie from Jellyfin");
            // set the loading into true
            this.isGetMovieLoading = true;

            if (this.jfURL === '' || this.jfUsername === '' || this.jfAPI === '') {
                // there are fields that not yet being filled, generate the error message
                var errorMessage = '';
                if(this.jfURL === '') {
                    errorMessage += "Jellyfin URL is empty.\n";
                }
                if(this.jfUsername === '') {
                    errorMessage += "Jellyfin Username is empty.\n";
                }
                if(this.jfAPI === '') {
                    errorMessage += "Jellyfin API Key is empty.\n";
                }
                this.showMsg(errorMessage, 'error');
            }
            else {
                // initialize the current page here, assuming that we will always start from page = 1
                // everytime user press the Get Movie button.
                this.currentPage = 1;

                // first get the username from the list, and check to ensure that this is administrator
                if(await this.getUserList()) {
                    // we get the user list
                    if(await this.getItemList()) {
                        // we get the item list, now we can get the movie list
                        if(await this.getMovieList()) {
                            // all done
                            this.printlog('info', 'Finished getting movie lists.');
                        }
                    }
                }
            }

            // once done, and we got all the Movie List, now we can generate the display list based 
            // on the movie list being generated.
            this.generateDisplayList();

            // set the loading into false, since we already finished
            this.isGetMovieLoading = false;
        },
        /**
         * forceUpdateMetadata
         * This function will perform update to all movie metadata that loaded by the tools.
         * On the process this function will call updateMetadata function for each movie loaded.
         * 
         * Return:
         * N/A
         */
        async forceUpdateMetadata() {
            this.printlog('info', "Perform update to ALL Metadata");

            // since will refresh A LOT of data, ensure to ask first user, that they
            // really want to do this.
            if(!(confirm("Do you want to refresh all " + this.totalMovie.toString() + " metadata?"))) {
                // user doesn't want to refresh all, abort!
                return;
            }

            // here we will call the update metadata for each record that we want to update
            this.isUpdateMetadata = true;

            // loop thru all movie list, and call update metadata
            this.numMovieScanned = 0;
            this.currentProgress = 0;
            for(var i=0; i < this.jfMovieList.length; i++) {
                // call update meatdata function
                await this.updateMetadata(i, false);
                this.numMovieScanned++;
                this.currentProgress = (this.numMovieScanned / this.totalMovie) * 100;
            }

            // once finished set back the isUpdateMetadata flag to false
            this.isUpdateMetadata = false;
        },
        /**
         * updateMetadata
         * This function is to format the body and post the metadata update to Jellyfin API.
         * 
         * For the basic information, we will get the details of the movie as reference value, before we perform
         * any update on the movie.
         * 
         * Here all the country tags that need to be put will be also formatted and created here.
         * 
         * For any data that doesn't have any countries, the update post will be skipped to save IO.
         * 
         * Params:
         * - idx  : Index of the movie on the Jellyfin Movie List parameter
         * - conf : confirmation enable or not? This is due this function can be called individually
         *          or thru update all metadata button. So we shouldn't ask any confirmation to user
         *          if user access this function thru Update Tag button.
         * 
         * Return:
         * N/A
         */
        async updateMetadata(idx, conf) {
            var index = this.getIndex(idx);

            // if confirm is true, it means that it was update individually
            if(conf) {
                this.printlog('info', "Specific metadata Update for " + this.jfMovieList[index].name + " (" + this.jfMovieList[index].id + ")");
                this.isUpdateMetadata = true;
            }

            // update the meta data of the movie with new tag
            // first ensure that the country is not empty for this one, if empty then just skip
            var updatedTag = [];
            var i, j;
            if(this.jfMovieList[index].country.length > 0) {
                // generate the updatedTag for this movie
                for(i=0; i<this.jfMovieList[index].country.length; i++) {
                    updatedTag.push("🌍 " + this.jfMovieList[index].country[i]);
                }

                // now check if we need to append the tags or not?
                if(!(this.replaceTags)) {
                    // we will not replace the tags, so we will appends the current tags to the updated tags.
                    // ensure we will not add again the "same" tags
                    for(i=0; i<this.jfMovieList[index].current_tags.length; i++) {
                        if(!(updatedTag.indexOf(this.jfMovieList[index].current_tags[i]) !== -1)) {
                            // tags not exists, push this tag to the updatedTag
                            updatedTag.push(this.jfMovieList[index].current_tags[i]);
                        }
                    }
                }

                // once we got the updatedTag that we will get the movie detail again that we will use to populate
                // the metadata later on
                try {
                    const movDetail = await this.getMovieDetails(this.jfMovieList[index].id);

                    // check for undefined fields, because each metadata might be have different fields here and there
                    // such as CriticRating, CommunityRating.
                    if(typeof movDetail.OriginalTitle === 'undefined') { movDetail.OriginalTitle = ""; }
                    if(typeof movDetail.ForcedSortName === 'undefined') { movDetail.ForcedSortName = ""; }
                    if(typeof movDetail.CommunityRating === 'undefined') { movDetail.CommunityRating = ""; }
                    if(typeof movDetail.CriticRating === 'undefined') { movDetail.CriticRating = ""; }
                    if(typeof movDetail.Overview === 'undefined') { movDetail.Overview = ""; }
                    if(typeof movDetail.Genres === 'undefined') { movDetail.Genres = []; }
                    if(typeof movDetail.PremiereDate === 'undefined') { movDetail.PremiereDate = ""; }
                    if(typeof movDetail.ProductionYear === 'undefined') { movDetail.ProductionYear = ""; }
                    if(typeof movDetail.OfficialRating === 'undefined') { movDetail.OfficialRating = ""; }
                    if(typeof movDetail.People === 'undefined') { movDetail.People = []; }
                    if(typeof movDetail.LockData === 'undefined') { movDetail.LockData = false; }
                    if(typeof movDetail.LockedFields === 'undefined') { movDetail.LockedFields = []; }
                    if(typeof movDetail.ProviderIds === 'undefined') { movDetail.ProviderIds = ""; }
                    if(typeof movDetail.PreferredMetadataLanguage === 'undefined') { movDetail.PreferredMetadataLanguage = ""; }
                    if(typeof movDetail.PreferredMetadataCountryCode === 'undefined') { movDetail.PreferredMetadataCountryCode = ""; }
                    if(typeof movDetail.Taglines === 'undefined') { movDetail.Taglines = []; }

                    // format the data that we will save since some of the fields being stripped off when posting the
                    // metadata to jellyfin API
                    // Studios doesn't have ID
                    var updatedStudios =[];
                    for(j=0; j<movDetail.Studios.length; j++) {
                        updatedStudios.push({ "Name": movDetail.Studios[j].Name });
                    }
                    
                    // once we got the move detail, now fill the update data that we will sent to jellyfin
                    var data = {
                        "Id": movDetail.Id,
                        "Name": movDetail.Name,
                        "OriginalTitle": movDetail.OriginalTitle,
                        "ForcedSortName": movDetail.ForcedSortName,
                        "CommunityRating": movDetail.CommunityRating,
                        "CriticRating": movDetail.CriticRating,
                        "IndexNumber": null,
                        "AirsBeforeSeasonNumber": "",
                        "AirsAfterSeasonNumber": "",
                        "AirsBeforeEpisodeNumber": "",
                        "ParentIndexNumber": null,
                        "DisplayOrder": "",
                        "Album": "",
                        "AlbumArtists": [],
                        "ArtistItems": [],
                        "Overview": movDetail.Overview,
                        "Status": "",
                        "AirDays": [],
                        "AirTime": "",
                        "Genres": movDetail.Genres,
                        "Tags": updatedTag,
                        "Studios": updatedStudios,
                        "PremiereDate": movDetail.PremiereDate,
                        "DateCreated": movDetail.DateCreated,
                        "EndDate": null,
                        "ProductionYear": movDetail.ProductionYear,
                        "AspectRatio": "",
                        "Video3DFormat": "",
                        "OfficialRating": movDetail.OfficialRating,
                        "CustomRating": "",
                        "People": movDetail.People,
                        "LockData": movDetail.LockData,
                        "LockedFields": movDetail.LockedFields,
                        "ProviderIds": movDetail.ProviderIds,
                        "PreferredMetadataLanguage": movDetail.PreferredMetadataLanguage,
                        "PreferredMetadataCountryCode": movDetail.PreferredMetadataCountryCode,
                        "Taglines": movDetail.Taglines
                    };

                    // console.debug(data);
                    // now post the data to Jellyfin and just hope for the best
                    var url = this.jfProto + this.jfURL + '/Items/' + movDetail.Id;
                    const postMetadata = await this.jfApiPost(url, this.jfAPI, data);
                    // check for the status
                    if (postMetadata.status === 204) {
                        // it's done!
                    }
                    else {
                        // something isn't right
                        this.printlog('error', "<updateMetadata> Error when updating (" + movDetail.Name + ") with ID (" + movDetail.Id + "). HTTP Status: " + postMetadata.status);
                        if(conf) { this.showMsg("Error when Updating Metadata.\nHTTP Status " + postMetadata.status, 'error'); }
                    }
                } catch(ex) {
                    this.printlog('error', "<updateMetadata> - " + ex);
                    if(conf) { this.showMsg("Error when Updating Metadata.\n" + ex, 'error'); }
                }

            }

            // if confirm is true, set back the isFetchingMetadata into false
            if(conf) { this.isUpdateMetadata = false; }
        },
        /**
         * forceRefreshTMDB
         * This function will perform TMDB API call to all movie metadata that loaded by the tools.
         * 
         * Since we will access external sites, the program will perform 0.5s delay for each API call
         * to prevent hammering on TMDB server.
         * 
         * Return:
         * N/A
         */
        async forceRefreshTMDB() {
            const sleep = m => new Promise(r => setTimeout(r, m));

            // since will refresh A LOT of data, ensure to ask first user, that they
            // really want to do this.
            if(!(confirm("Do you want to refresh all " + this.totalMovie.toString() + " from TMDB?"))) {
                // user doesn't want to update, abort!
                return;
            }

            // show log when we start the task
            this.printlog('info', "Perform TMDB refresh to all Movie List");

            // set the loading for the fetch into true
            this.isFetchingTMDB = true;

            // loop thru all movie list, and call fetch tmdb
            this.numMovieScanned = 0;
            this.currentProgress = 0;
            for(var i=0; i < this.jfMovieList.length; i++) {
                // cal the fetchTMDB function
                await this.fetchTMDB(i, this.jfMovieList[i].tmdb, false);
                this.numMovieScanned++;
                this.currentProgress = (this.numMovieScanned / this.totalMovie) * 100;
                // sleep for 2s, so we will not going to hammer TMDB server
                await sleep(500);
            }

            // once done reset back the fetching status into false
            this.isFetchingTMDB = false;
        },
        /**
         * fetchTMDB
         * This function will perform API call to TMDB to get the information of the movie based on the TMDB
         * ID that being stored on the movie metadata.
         * 
         * Once got the data from TMDB, program will perform any checking necessary, and later will
         * populate the country list to the current Jellyfin Movie Library data.
         * 
         * Params:
         * - idx  : Index number of the movie being processed
         * - tmdb : TMDB ID of the movie
         * - conf : confirmation enable or not? This is due this function can be called individually
         *          or thru Force TMDB button.
         */
        async fetchTMDB(idx, tmdb, conf) {
            var index = this.getIndex(idx);

            // if confirm is true, it means this is being triggered individually
            // set the isFetchingTMDB into true here
            if(conf) {
                this.printlog('info', "TMDB refresh for ID:" + tmdb);
                this.isFetchingTMDB = true;
            }

            // check if the tmdb api is empty or not?
            if(this.tmdbAPI === '') {
                if(conf) { this.showMsg("TMDB API Key is empty, cannot perform TMDB refresh.", 'error'); }
            }
            else {
                // ensure that we have TMDB ID before we call TMDB API
                if(!(tmdb === '')) {
                    // perform API call to Jellyfin to get list of items
                    try {
                        var tmdbUrl = 'https://api.themoviedb.org/3/movie/' + tmdb + '?api_key=' + this.tmdbAPI + '&language=en-US';
                        const res = await this.tmdbApiGet(tmdbUrl);
                        
                        // check if status is 200
                        if(res.status === 200) {
                            // got data from tmdb, parse the json and compare with current data
                            // compare the title to ensure that this is the same movie that you refresh
                            if(conf) {
                                if(!(res.data.title.toLowerCase() === this.jfMovieList[index].name.toLowerCase())) {
                                    // ask user if they really want to refresh?
                                    if(confirm('Title from TMDB (' + res.data.title + ') is diferrent with Metadata (' + this.jfMovieList[index].name + ').\nDo you still want to refresh?')) {
                                        // user still update, continue
                                    }
                                    else {
                                        // user doesn't want, just return from the function
                                        return;
                                    }
                                }
                            }

                            // update the country with the list we got from TMDB
                            var productionCountries = [];
                            for(var i=0; i < res.data.production_countries.length; i++) {
                                // get the countries, and put on the array
                                productionCountries.push(res.data.production_countries[i].name);
                            }

                            // in case that productionCountries is 0, then check if use want to continue or not?
                            if(productionCountries.length <= 0) {
                                if(conf) {
                                    if(!(confirm('There are no production countries for ' + this.jfMovieList[index].name))) {
                                        return;
                                    }
                                }
                                this.printlog('warn', "Movie " + this.jfMovieList[index].name + " production countries is empty from TMDB");
                            }

                            // assigned this array to the movie list
                            this.jfMovieList[index].country = productionCountries;
                        }
                        else {
                            this.printlog('error', "<fetchTMDB> - Error when connecting to TMDB with status: " + res.status);
                            this.showMsg("Error when connecting to TMDB with status " + res.status, 'error');
                        }
                    } catch (ex) {
                        this.printlog('error', "<fetchTMDB> - " + ex);
                        this.showMsg("Error when connecting to TMDB.\n" + ex, 'error');
                    }
                }
            }

            // once done check if this is confirm or not? if confirm, then set back the isFetchingTMDB into false
            if(conf) { this.isFetchingTMDB = false; }
        },
        /**
         * removeTag
         * This function will remove the tag from the Jellyfin Movie List variable.
         * 
         * Params:
         * - idx : Index of the movie in Jellyfin Movie List variable.
         * - tag : The Tag name that will be removed.
         */
        removeTag(idx, tag) {
            var index = this.getIndex(idx);

            // pop the tag arrays, and recreate the country that need to be displayed?
            this.printlog('info', "Delete Tag (" + tag + ") from Movie (" + this.jfMovieList[index].name + ")");

            if(this.jfMovieList[index].country.length > 0) {
                // loop thru all the the tags and add the one that not being removed
                let updatedTags = this.jfMovieList[index].country;
                this.jfMovieList[index].country = updatedTags.filter((country) => country != tag);
            }
        },
        /**
         * handleInputTagConfirm
         * This function is used to handle the input fields that will be used to add the new tag to
         * Jellyfin Movie List.
         * 
         * Params:
         * - idx : Index of the movie in Jellyfin Movie List variable.
         */
        handleInputTagConfirm(idx) {
            var index = this.getIndex(idx);

            if(this.inputTagValue.trim().length > 0) {
                this.printlog('info', "Add Tag (" + this.inputTagValue + ") to Movie (" + this.jfMovieList[index].name + ")");
                
                // check if the tag is already available on the array or not?
                // since we need to perform not-case-sensitive on the Tag, hence need to perform loop on the tags
                // and see if the tag being inputted is the same or not?
                var currentTag = this.inputTagValue.toLowerCase();
                for(var i=0; i<this.jfMovieList[index].country.length; i++) {
                    if(this.jfMovieList[index].country[i].toLowerCase() === currentTag) {
                        this.printlog('info', "Tag (" + this.inputTagValue + " already exists in Movie (" + this.jfMovieList[index].name + ")");
                        return;
                    }
                }

                // if we passed the check above, it means that it's safe to add the tag on the list
                this.jfMovieList[index].country.push(this.inputTagValue);
                this.inputTagValue = '';
            }
        },
    }
}
</script>

<style>
.container {
    width: 100%;
}

.submitForm {
    width: 500px;
    margin: auto;
}

.tableContainer {
    width: 1000px;
    margin: auto;
}

.formRow {
    margin-bottom: 10px;
}

.tagAddButton {
    width: 20px;
    height: 20px;
    margin-left: 5px;
    padding: 0px;
}

.inputNewTag {
    width: 180px;
    margin: 10px;
    vertical-align: bottom;
}

.successIcon {
    color: rgb(0, 209, 45);
}

.copyrightNote {
    text-align: center;
    color: #acacac;
    font-size: 10px;
}

.el-select .el-input {
    width: 110px;
}

.el-input-group__prepend {
    background-color: rgb(70, 70, 70);
    color: #fff;
    width: 100px;
    border: 0px;
}

.el-table td, .el-table th {
    padding: 5px 0;
    min-width: 0;
    box-sizing: border-box;
    text-overflow: ellipsis;
    vertical-align: middle;
    position: relative;
    text-align: left;
}

.el-table {
    font-size: 12px;
    color: #606266;
}

.el-checkbox__input.is-checked .el-checkbox__inner, .el-checkbox__input.is-indeterminate .el-checkbox__inner {
    background-color: #FF4040;
    border-color: #C62F2F;
}

.el-checkbox__input.is-checked + .el-checkbox__label {
    color: #C62F2F;
}

.el-checkbox__input.is-focus .el-checkbox__inner {
    color: #C62F2F;
}

.el-checkbox__inner:hover {
    border-color: #C62F2F;
}

.el-progress-bar__inner {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background-color: #FF4040;
    text-align: right;
    border-radius: 100px;
    line-height: 1;
    white-space: nowrap;
    transition: width .6s ease;
}

.el-progress-bar__outer {
    height: 6px;
    border-radius: 100px;
    background-color: #6c6c6c;
    overflow: hidden;
    position: relative;
    vertical-align: middle;
}

.el-button--primary {
    color: #FFF;
    background-color: #FF4040;
    border-color: #C62F2F;
}

.el-button--primary:focus, .el-button--primary:hover {
    background: #f66;
    border-color: rgb(230, 89, 89);
    color: #FFF;
}

.el-button--primary.is-disabled, .el-button--primary.is-disabled:active, .el-button--primary.is-disabled:focus, .el-button--primary.is-disabled:hover {
    color: #FFF;
    background-color: #ffa0a0;
    border-color: #ffa0a0;
}

.el-select-dropdown__item.selected {
    color: #FF4040;
    font-weight: 700;
}

.el-loading-spinner .path {
    -webkit-animation: loading-dash 1.5s ease-in-out infinite;
    animation: loading-dash 1.5s ease-in-out infinite;
    stroke-dasharray: 90,150;
    stroke-dashoffset: 0;
    stroke-width: 2;
    stroke: #FF4040;
    stroke-linecap: round;
}

.el-pagination.is-background .el-pager li:not(.disabled).active {
    background-color: #FF4040;
    color: #FFF;
}

.el-pagination.is-background .el-pager li:not(.disabled):hover {
    color: #7D0000;
}
</style>