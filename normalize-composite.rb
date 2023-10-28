require 'json'

TYPES = %w(
    Omega\ Psychic
    High\ Dragon
    Celestial\ Warrior
    Magical\ Knight
    Sea\ Serpent
    Winged\ Beast
    Beast-Warrior
    Divine-Beast
    Aqua Beast Cyberse Cyborg Dinosaur Dragon Fairy Fiend Fish Galaxy Illusion Insect Machine Plant Psychic Pyro Reptile Rock Spellcaster Thunder Warrior Wyrm Zombie Yokai
)
TYPES_REG = Regexp.new TYPES.join "|"
ATTRIBUTES = %w(
    DARK DIVINE EARTH FIRE LIGHT WATER WIND
)
ATTRIBUTES_REG = Regexp.new ATTRIBUTES.join "|"
NAME_REGEX = /"((?:".*?")?(?: ".*?"|[^"])+|"[^"]+")"/

def normalize_card!(card)
    # TODO: use treated_as property?
    extra_types = []
    extra_attributes = []
    extra_names = []
    
    card["also_archetype"] ||= nil
    # TODO: fix date property
    card["date"] ||= nil
    card["exu_limit"] ||= card["tcg_limit"] || 3
    
    # TODO: banlist information
    
    # also always
    if card["effect"] =~ /\(.*This card is also always treated as an?(.+?)(?:monster|card).*\)/
        extra_props = $1.dup
        
        extra_props.gsub!(TYPES_REG) {
            extra_types << $&
            ""
        }
        extra_props.gsub!(ATTRIBUTES_REG) {
            extra_attributes << $&
            ""
        }
        extra_props.gsub!(NAME_REGEX) {
            extra_names << $1
            ""
        }
        # puts card["name"], extra_props.inspect, { types: extra_types, attr: extra_attributes, name: extra_names }, "-" * 30
    end
    # type change
    if card["effect"] =~ /\(.*This (?:card|monster).?s original Type is treated as (.+?) rather than.*\)/
        card["type"] = $1
        # p card
    end
    # name always change
    if card["effect"] =~ /\(This (?:card|monster).?s name is always treated as "(.+?)".*\)/
        card["treated_as"] = $1
    end
    # name also always change
    if card["effect"] =~ /\(This (?:card|monster).?s name is also always treated as "(.+?)".*\)/
        extra_names << $1
    end
    
    # ensure pendulum effects are defined
    if card["pendulum"] != 0
        card["pendulum_effect"] ||= ""
    end
    
    # ensure src
    card["src"] ||= "https://www.duelingbook.com/images/low-res/#{card["id"]}.jpg"
    
    # update accordingly
    card["attribute"] = ([card["attribute"]] + extra_attributes).join " "
    card["type"] = ([card["type"]] + extra_types).join " "
    card["also_archetype"] = extra_names.join " "
end

data = JSON::parse File.read "unifiedComposite.json"
data.each { |card_id, card|
    normalize_card! card
}

# TODO: interact with alt arts?
banlist = JSON::parse File.read "banlist.json"
banlist["banned"].each { |id| data[id.to_s]["exu_limit"] = 0 }
banlist["limited"].each { |id| data[id.to_s]["exu_limit"] = 1 }
banlist["semi-limited"].each { |id| data[id.to_s]["exu_limit"] = 2 }
banlist["unlimited"].each { |id| data[id.to_s]["exu_limit"] = 3 }

puts "Writing normalized results to db-tmp.json..."
File.write "db-tmp.json", data.to_json
