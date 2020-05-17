check_sys_user(){
    who | grep $2 > /dev/null 2>&1
    result=$?
    if [[ `egrep -i ^$2: /etc/passwd ; echo $?` != 0 && $result != 0 ]]; then 
        echo "ERROR - Please check the system_user_name."; fail=1
    fi
}

check_ip()
{
    local ip=$2
    ip_stat=1
    ip_pass=0

    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        OIFS=$IFS
        IFS='.'
        ip=($ip)
        IFS=$OIFS
        [[ ${ip[0]} -le 255 && ${ip[1]} -le 255 \
            && ${ip[2]} -le 255 && ${ip[3]} -le 255 ]]
        ip_stat=$?
        if [[ ! $ip_stat == 0 ]]; then
            echo "ERROR - Invalid value for $key"; fail=1
            ip_pass=0
        fi
        is_local_ip=`ip a | grep $2` > /dev/null 2>&1
        if [[ $ip_pass == 0 && $is_local_ip != *$2* ]]; then
            echo "ERROR - Invalid value for $key. Please enter the local ip of this system."; fail=1 
        fi
    else
        echo "ERROR - Invalid value for $key"; fail=1
    fi
}

check_aws_key(){
    aws_key_status=0
    export AWS_ACCESS_KEY_ID=$1
    export AWS_SECRET_ACCESS_KEY=$2
    aws s3api list-buckets > /dev/null 2>&1
    if [ ! $? -eq 0 ]; then echo "ERROR - Invalid aws access or secret keys"; fail=1
        aws_key_status=1
    fi
}
check_s3_bucket(){
    #check_aws_key $3 $4
    if [[ $aws_key_status == 0 ]]; then
        bucketstatus=`aws s3api head-bucket --bucket "${2}" 2>&1`
        if [ $? == 0 ]
        then
           tput setaf 3; echo "Warning: [ $1 ]:[ $2 ] Bucket owned and already exists"; tput sgr0
            while true; do
            read -p "Do you want to continue with same bucket name [$2] as [$1]? (yes/no): " answer
            case $answer in
                yes )
                    break
                    ;; 
                no ) 
                    tput setaf 3; echo "Please change the $1 value in config.yml."; tput sgr0
                    fail=1
                    break
                    ;;
                * )
                    echo "Please enter yer or no ";;
            esac
            done
            count=0
        elif [[ $bucketstatus == *"Not Found"* ]]; then
            echo "Bucket name $2 is available."
        elif [[ "$bucketstatus" == *"Forbidden"* ]]; then
            tput setaf 1; echo "Error: [ $1 : $2 ] Bucket already exists but not owned. Please change the bucket name in vars/main.yml"; tput sgr0; fail=1
        elif [[ "$bucketstatus" == *"Bad Request"* ]]; then
            tput setaf 1; echo "Error: [ $1 : $2 ] Bucket name should be between 3 and 63 characters. Please change the bucket name in vars/main.yml"; tput sgr0; fail=1
        else
            tput setaf 1; echo "Error: [ $1 : $2 ] $bucketstatus"; tput sgr0; fail=1
        fi
    fi
}

check_nifi_port(){
    port_status=$(sudo lsof -i:$2)
    if [ $? == 0 ]; then
        echo "Error - Port $2 is already running. Please change the port."; fail=1
    fi
}

check_db_naming(){
    initial="$(echo $2 | head -c 1)"
    if [[ $initial != [0-9] ]] ; then
        echo "$2" |  grep "[@#$%^&*-]"
        if [[ ! $? -eq 1 ]]; then
            echo "Error - Naming convention is not correct. Please change the value of $1."; fail=1
        fi
    else
        echo "Error - Naming convention is not correct. Please change the value of $1."; fail=1
    fi
}

check_db_password(){
    len="${#2}"
    if test $len -ge 8 ; then
        echo "$2" | grep "[A-Z]" | grep "[a-z]" | grep "[0-9]" | grep "[@#$%^&*]" > /dev/null 2>&1
        if [[ ! $? -eq 0 ]]; then
            echo "Error - Password should contain atleast one uppercase, one lowercase, one special character and one number. And should be minimum of 8 characters."; fail=1
        fi
    else
        echo "Error - Password should contain atleast one uppercase, one lowercase, one special character and one number. And should be minimum of 8 characters."; fail=1
    fi
}

check_api_endpoint(){
    ip_api=$(echo "$2" | grep -o -P '(?<=//).*(?=:)')
    public_ip=$(dig +short myip.opendns.com @resolver1.opendns.com)
    if [[ ! "$ip_api" =~ ^(([1-9]?[0-9]|1[0-9][0-9]|2([0-4][0-9]|5[0-5]))\.){3}([1-9]?[0-9]|1[0-9][0-9]|2([0-4][0-9]|5[0-5]))$ ]]; then
        echo "Error - Public IP validation failed. Please provide the correct value of $1"; fail=1
        if [[ ! $ip_api == $public_ip ]] ; then
            echo "Error - Public IP validation failed. Please provide the correct value of $1"; fail=1
        fi
    fi
}

check_mem_variables(){
##=========================================================================
    kb=`head -1 /proc/meminfo | awk '{ print $2 }'` #reading RAM size in kb
    mb=`echo "scale=0; $kb / 1024" | bc` # to MB    #converting RAM size to mb

java_arg_2=$1
java_arg_3=$2

java3_arg=`echo $2 | cut -c 5-` #start reading from 512m and leave the rest of it

#jk3=`echo ${java3_arg: -1}` # get the last 1 characters to know if m or g
#jk3_mem="${java3_arg::-1}"  #remove the last character and get the number only
if [ ! "$jk3" = "m" ] || [ ! "$jk3" = "g" ] ; then
	echo "Error - Invalid memory type $java_arg_3"; fail=1
fi

if [ $jk3 = "g" ] ; then
   jk3_mem=$(($jk3_mem*1024))
fi

jk3_cr=`echo $java_arg_3 | cut -c1-4`
if [[ ! $jk3_mem =~ ^[0-9]+$ ]] || [ ! $jk3_cr == "-Xmx" ] ; then
        echo "Error - Invalid memory type $java_arg_3"; fail=1
fi

java2_arg=`echo $java_arg_2 | cut -c 5-`
#jk2=`echo ${java2_arg: -1}`
#jk2_mem="${java2_arg::-1}"

if [ ! "$jk2" = "m" ] || [ ! "$jk2" = "g" ] ; then
        echo "Error - Invalid memory type $java_arg_2"; fail=1
fi

if [ $jk2 = "g" ] ; then
   jk2_mem=$(($jk2_mem*1024))
fi

jk2_cr=`echo $java_arg_2 | cut -c1-4`
if [[ ! $jk2_mem =~ ^[0-9]+$ ]] || [ ! $jk2_cr == "-Xms" ] ; then
        echo "Error - Invalid memory type $java_arg_2"; fail=1 
fi

work_mem=$3
#wk=`echo ${work_mem: -2}` #get the last to characters either MB or GB
#wk_mem="${work_mem::-2}"  #remove last 2 characters and assign the number"

if [ ! "$wh" = "MB" ] || [ ! "$wk" = "GB" ] ; then
        echo "Error - Invalid memory type $work_mem"; fail=1
fi

share_mem=$4
#sk=`echo ${share_mem: -2}` #get the last to characters either MB or GB
#sk_mem="${share_mem::-2}"  #remove last 2 characters and assign the number"

if [ ! "$sk" = "MB" ] || [ ! "$sk" = "GB" ] ; then
        echo "Error - Invalid memory type $share_mem"; fail=1
fi

#coversion to MB
if [ $wk = "GB" ]; then
	w_mem=$(($wk_mem*1024))
fi

#conversion to MB
if [ $sk = "GB" ]; then
        s_mem=$(($sk_mem*1024))
fi

#addition of all memories
case $jk in
	"m") if [ ! $(($jk_mem+$jk2_mem+$w_mem+$s_mem)) -le $mb ]; then 
            echo "Invalid memory configuration."
        fi
	;;
esac
}
##=========================================================================
get_config_values(){
key=$1
vals[$key]=$(awk ''/^$key:' /{ if ($2 !~ /#.*/) {print $2}}' config.yml)
}

bold=$(tput bold)
normal=$(tput sgr0)
fail=0
if [[ ! $# -eq 0 ]]; then
   core_install=$1
else
   core_install="NA"
fi

echo -e "\e[0;33m${bold}Validating the config file...${normal}"


# An array of mandatory values
declare -a arr=("system_user_name" "db_user" "db_name" "db_password" "emission_db_name" "nifi_port" "s3_input_bucket" "s3_output_bucket" \
	        "s3_emission_bucket" "shared_buffers" "work_mem" "java_arg_2" "java_arg_3" "s3_access_key" "s3_secret_key" "aws_default_region" \
		"local_ipv4_address" "api_endpoint" "db_connection_url" "db_driver_dir" "db_driver_class_name" "nifi_error_dir") 

# Create and empty array which will store the key and value pair from config file
declare -A vals

# Getting aws keys
aws_access_key=$(awk ''/^s3_access_key:' /{ if ($2 !~ /#.*/) {print $2}}' config.yml)
aws_secret_key=$(awk ''/^s3_secret_key:' /{ if ($2 !~ /#.*/) {print $2}}' config.yml)

# Getting memory args
shared_buffers=$(awk ''/^shared_buffers:' /{ if ($2 !~ /#.*/) {print $2}}' config.yml)
work_mem=$(awk ''/^work_mem:' /{ if ($2 !~ /#.*/) {print $2}}' config.yml)
java_arg_2=$(awk ''/^java_arg_2:' /{ if ($2 !~ /#.*/) {print $2}}' config.yml)
java_arg_3=$(awk ''/^java_arg_3' /{ if ($2 !~ /#.*/) {print $2}}' config.yml)

# Iterate the array and retrieve values for mandatory fields from config file
for i in ${arr[@]}
do
get_config_values $i
done

for i in ${arr[@]}
do
key=$i
value=${vals[$key]}
case $key in
   system_user_name)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_sys_user $key $value
       fi
       ;;
   s3_access_key)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       fi
       ;;
   s3_secret_key)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
      else
          check_aws_key $aws_access_key $aws_secret_key
       fi
       ;;
   s3_input_bucket)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_s3_bucket $key $value 
       fi
       ;;
   s3_output_bucket)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_s3_bucket $key $value 
       fi
       ;;
   s3_emission_bucket)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_s3_bucket $key $value 
       fi
       ;;
   local_ipv4_address)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_ip $key $value
       fi
       ;;
   nifi_port)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_nifi_port $key $value
       fi
       ;;
   db_user)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_db_naming $key $value
       fi
       ;;
   db_name)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_db_naming $key $value
       fi
       ;;
   db_password)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_db_password $key $value
       fi
       ;;
   api_endpoint)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_api_endpoint $key $value
       fi
       ;;
   emission_db_name)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       else
          check_db_naming $key $value
       fi
       ;;
   db_connection_url)
       if [[ ! "$value" =~ ^(jdbc:postgresql://localhost:5432/)$ ]]; then
          echo "ERROR - Valid values for $key is jdbc:postgresql://localhost:5432/"; fail=1
       fi
       ;;
   db_driver_dir)
       if [[ ! "$value" =~ ^(jars/postgresql-42.2.10.jar)$ ]]; then
          echo "ERROR - Valid values for $key is jars/postgresql-42.2.10.jar"; fail=1
       fi
       ;;
   db_driver_class_name)
       if [[ ! "$value" =~ ^(org.postgresql.Driver)$ ]]; then
          echo "ERROR - Valid values for $key is org.postgresql.Driver"; fail=1
       fi
       ;;
   shared_buffers)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       fi
       ;;
   work_mem)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       fi
       ;;
   java_arg_2)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
       fi
       ;;
   java_arg_3)
       if [[ $value == "" ]]; then
          echo "ERROR - Value for $key cannot be empty. Please fill this value"; fail=1
            #check_mem_variables $java_arg_2 $java_arg_3 $work_mem $shared_buffers 
       fi
       ;;
    nifi_error_dir)
       if [[ ! "$value" =~ ^(/opt/nifi/nifi_errors)$ ]]; then
          echo "ERROR - Valid values for $key is /opt/nifi/nifi_errors"; fail=1
       fi
       ;;
   *)
       if [[ $value == "" ]]; then
          echo -e "\e[0;31m${bold}ERROR - Value for $key cannot be empty. Please fill this value${normal}"; fail=1
       fi
       ;;
esac
done

if [[ $fail -eq 1 ]]; then
   echo -e "\e[0;34m${bold}Config file has errors. Please rectify the issues and rerun${normal}"
   exit 1
else
   echo -e "\e[0;32m${bold}Config file successfully validated${normal}"
fi